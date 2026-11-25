// 관리자 웹 목업 백엔드: 고정 시드로 회원을 만들고, 점검·제재는 공용 목업 서버 저장소(server.ts)에 쓴다.
import type {
  AccessLog,
  AdminBackend,
  Member,
  MemberDetail,
  MemberPage,
  MemberQuery,
  MemberRow,
  MemberStatusFilter,
  SanctionInput,
  SanctionRow,
  UsageStats,
  VersionRow,
  VersionStats,
} from './admin';
import {
  DEMO_MEMBER_ID,
  activeSanction,
  loadServerState,
  saveServerState,
  validateMaintenance,
  type Client,
  type Maintenance,
  type MaintenanceInput,
  type Sanction,
  type SanctionReason,
  type ServerState,
} from './server';

export const OPERATOR = '운영자';

const DAY = 86_400_000;
const MEMBER_COUNT = 1860;

/** 같은 시드면 항상 같은 수열 (새로 고쳐도 회원 목록이 그대로) */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const RELEASES: { version: string; releasedAt: string; status: VersionRow['status']; share: number }[] = [
  { version: '2.0.0', releasedAt: '2026-10-14', status: 'latest', share: 0.56 },
  { version: '1.9.4', releasedAt: '2026-08-27', status: 'supported', share: 0.23 },
  { version: '1.9.3', releasedAt: '2026-07-09', status: 'supported', share: 0.09 },
  { version: '1.8.2', releasedAt: '2026-04-16', status: 'deprecated', share: 0.07 },
  { version: '1.7.0', releasedAt: '2025-12-03', status: 'deprecated', share: 0.05 },
];

const ADJ = ['피곤한', '배고픈', '용감한', '수줍은', '졸린', '신나는', '느긋한', '반짝이는', '조용한', '씩씩한', '엉뚱한', '다정한', '부지런한', '심심한', '빛나는'];
const NOUN = ['고양이', '판다', '여우', '토끼', '펭귄', '수달', '다람쥐', '고래', '부엉이', '햄스터', '너구리', '오리', '거북이', '사슴', '곰돌이'];
const SUFFIX = ['', '', '', 'TV', '방송', '_live', '님', '짱', '123', '77'];
const ROMA = ['cat', 'panda', 'fox', 'bunny', 'peng', 'otter', 'squirrel', 'whale', 'owl', 'hammy', 'raccoon', 'duck', 'turtle', 'deer', 'bear'];
const DOMAINS = ['gmail.com', 'naver.com', 'kakao.com', 'daum.net', 'hanmail.net'];
const LOGIN = ['통합 로그인', '통합 로그인', '네이버 로그인', '카카오 로그인', '구글 로그인', '트위치 로그인'];

const SIGNALS: { signal: SanctionReason; detail: string }[] = [
  { signal: 'request_flood', detail: '분당 요청 1,200회 이상이 30분 넘게 이어짐 (평균 40회)' },
  { signal: 'tampered_client', detail: '서명되지 않은 설치형 클라이언트로 접속' },
  { signal: 'automation', detail: '스킵·재생 요청이 0.2초 간격으로 반복됨' },
  { signal: 'account_sharing', detail: '서로 다른 지역 IP 4곳에서 동시 접속' },
];

function pickWeighted<T>(r: number, items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let x = r * total;
  for (const i of items) {
    if ((x -= i.weight) < 0) return i.value;
  }
  return items[items.length - 1].value;
}

export function makeMembers(now: number): Member[] {
  const r = seeded(20261023);
  const pick = <T,>(list: T[]) => list[Math.floor(r() * list.length)];
  const members: Member[] = [];
  for (let i = 0; i < MEMBER_COUNT; i++) {
    const a = Math.floor(r() * ADJ.length);
    const n = Math.floor(r() * NOUN.length);
    const nickname = `${ADJ[a]}${NOUN[n]}${pick(SUFFIX)}`;
    const toonationId = `${ROMA[n]}${Math.floor(r() * 9000 + 100)}`;
    const clients: Client[] = [];
    if (r() < 0.64) clients.push('desktop');
    if (r() < 0.42) clients.push('web');
    if (r() < 0.36 || clients.length === 0) clients.push('mobile');
    const desktop = clients.includes('desktop');
    // 마지막 접속: 최근일수록 많게 (0~90일)
    const lastSeenAt = now - Math.floor(Math.pow(r(), 2.4) * 90 * DAY);
    const joinedAt = now - Math.floor((120 + r() * 1400) * DAY);
    members.push({
      id: `M${100002 + i}`,
      toonationId,
      nickname,
      email: `${toonationId}@${pick(DOMAINS)}`,
      loginMethod: pick(LOGIN),
      clients,
      os: desktop ? (r() < 0.93 ? 'Windows' : 'macOS') : undefined,
      appVersion: desktop ? pickWeighted(r(), RELEASES.map((v) => ({ value: v.version, weight: v.share }))) : undefined,
      joinedAt,
      desktopSince: desktop ? Math.max(joinedAt, Math.min(lastSeenAt, now - Math.floor(Math.pow(r(), 1.4) * 700 * DAY))) : undefined,
      lastSeenAt,
      online: now - lastSeenAt < 15 * 60_000 || r() < 0.05,
      suspicion: r() < 0.016 ? { ...pick(SIGNALS), detectedAt: now - Math.floor(r() * 6 * DAY) } : undefined,
    });
  }
  // 리모컨 목업에 로그인하는 회원: 관리자 웹에서 정지하면 같은 브라우저의 웹 리모컨이 바로 막힌다
  members.unshift({
    id: DEMO_MEMBER_ID,
    toonationId: 'tiredcat',
    nickname: '피곤한고양이',
    email: 'tiredcat@gmail.com',
    loginMethod: '통합 로그인',
    clients: ['desktop', 'web', 'mobile'],
    os: 'Windows',
    appVersion: '2.0.0',
    desktopSince: now - 400 * DAY,
    joinedAt: now - 820 * DAY,
    lastSeenAt: now - 60_000,
    online: true,
  });
  return members;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const dateKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** 처음 열었을 때 보여 줄 제재·점검 이력 (저장소가 비어 있을 때만) */
function seedServerState(members: Member[], now: number): ServerState {
  const suspicious = members.filter((m) => m.suspicion);
  const sanctions: Sanction[] = suspicious.slice(0, 5).map((m, i) => ({
    id: `S${uid()}`,
    memberId: m.id,
    reason: m.suspicion!.signal,
    memo: `${m.suspicion!.detail}. 로그 확인 후 조치.`,
    start: now - (i + 1) * 2 * DAY,
    until: i === 0 ? null : now - (i + 1) * 2 * DAY + [0, 7, 30, 1, 7][i] * DAY,
    createdBy: OPERATOR,
    createdAt: now - (i + 1) * 2 * DAY,
    ...(i === 2 ? { liftedAt: now - 3 * DAY, liftedBy: OPERATOR, liftMemo: '이용자 소명 확인 (공용 PC 사용)' } : {}),
  }));
  const at = (daysAgo: number, hour: number) => {
    const d = new Date(now - daysAgo * DAY);
    d.setHours(hour, 0, 0, 0);
    return d.getTime();
  };
  const maintenances: Maintenance[] = [
    {
      id: `P${uid()}`,
      start: at(23, 2),
      end: at(23, 6),
      targets: ['desktop', 'web', 'mobile'],
      message: '리모컨 2.0 출시를 위한 서버 점검을 진행하고 있습니다.\n점검 시간 동안 리모컨을 이용할 수 없습니다.',
      noticeUrl: 'https://help.toon.at/hc/ko/articles/maintenance',
      noticeLeadMinutes: 1440,
      createdBy: OPERATOR,
      createdAt: at(26, 15),
    },
    {
      id: `P${uid()}`,
      start: at(9, 4),
      end: at(9, 5),
      targets: ['desktop'],
      message: '설치형 리모컨 업데이트 서버 점검 중입니다.',
      noticeLeadMinutes: 60,
      createdBy: OPERATOR,
      createdAt: at(10, 11),
    },
  ];
  return { sanctions, maintenances };
}

export class MockAdminBackend implements AdminBackend {
  private members: Member[];
  private now = Date.now();

  constructor() {
    this.members = makeMembers(this.now);
    try {
      if (localStorage.getItem('toona.mockServer') === null) saveServerState(seedServerState(this.members, this.now));
    } catch {
      /* noop */
    }
  }

  private get server() {
    return loadServerState();
  }

  private row(m: Member, sanctions: Sanction[], now: number): MemberRow {
    return { ...m, sanction: activeSanction(sanctions, m.id, now) };
  }

  async usageStats(rangeDays: number): Promise<UsageStats> {
    await delay();
    const now = Date.now();
    const since = now - rangeDays * DAY;
    const online: Record<Client, number> = { desktop: 0, web: 0, mobile: 0 };
    const active: Record<Client, number> = { desktop: 0, web: 0, mobile: 0 };
    const desktopOs = { Windows: 0, macOS: 0 };
    let desktopMembers = 0;
    let newDesktop = 0;
    for (const m of this.members) {
      for (const c of m.clients) {
        if (m.online) online[c]++;
        if (m.lastSeenAt >= since) active[c]++;
      }
      if (m.os) {
        desktopMembers++;
        if (m.lastSeenAt >= since) desktopOs[m.os]++;
        if ((m.desktopSince ?? 0) >= since) newDesktop++;
      }
    }
    // 일간 이용자: 회원 데이터에서 날짜별 접속을 다 만들 수 없어, 기간 이용자 수에 맞춰 요일 흐름을 흉내 낸다
    const r = seeded(rangeDays * 7919);
    const base = active.desktop * 0.46;
    const daily = Array.from({ length: rangeDays }, (_, i) => {
      const t = now - (rangeDays - 1 - i) * DAY;
      const dow = new Date(t).getDay();
      const weekend = dow === 0 || dow === 6 ? 1.14 : dow === 5 ? 1.06 : 1;
      const growth = 0.9 + (0.1 * i) / Math.max(1, rangeDays - 1);
      return { date: dateKey(t), users: Math.round(base * weekend * growth * (0.94 + r() * 0.12)) };
    });
    // 오늘은 아직 하루가 끝나지 않았다
    daily[daily.length - 1].users = Math.round(daily[daily.length - 1].users * Math.min(1, new Date(now).getHours() / 24 + 0.15));
    return { rangeDays, totalMembers: this.members.length, desktopMembers, newDesktop, online, active, desktopOs, daily };
  }

  async versionStats(): Promise<VersionStats> {
    await delay();
    const rows: VersionRow[] = RELEASES.map((r) => ({ version: r.version, releasedAt: new Date(`${r.releasedAt}T10:00:00`).getTime(), status: r.status, users: 0, windows: 0, mac: 0 }));
    for (const m of this.members) {
      const row = rows.find((v) => v.version === m.appVersion);
      if (!row) continue;
      row.users++;
      if (m.os === 'macOS') row.mac++;
      else row.windows++;
    }
    return { latest: RELEASES[0].version, total: rows.reduce((s, v) => s + v.users, 0), rows };
  }

  async searchMembers(q: MemberQuery): Promise<MemberPage> {
    await delay();
    const now = Date.now();
    const { sanctions } = this.server;
    const rows = this.members.map((m) => this.row(m, sanctions, now));
    const kw = q.keyword.trim().toLowerCase();
    const matchKw = (m: MemberRow) => {
      if (!kw) return true;
      const fields = q.field === 'all' ? [m.nickname, m.toonationId, m.email, m.id] : [m[q.field]];
      return fields.some((f) => f.toLowerCase().includes(kw));
    };
    const statusOf: Record<MemberStatusFilter, (m: MemberRow) => boolean> = {
      all: () => true,
      normal: (m) => !m.sanction,
      suspended: (m) => !!m.sanction,
      suspicious: (m) => !!m.suspicion && !m.sanction,
    };
    const base = rows.filter((m) => matchKw(m) && (q.client === 'all' || m.clients.includes(q.client)) && (q.version === 'all' || m.appVersion === q.version));
    const counts = { all: 0, normal: 0, suspended: 0, suspicious: 0 } as Record<MemberStatusFilter, number>;
    for (const m of base) for (const k of Object.keys(counts) as MemberStatusFilter[]) if (statusOf[k](m)) counts[k]++;
    const filtered = base.filter(statusOf[q.status]);
    filtered.sort((a, b) => (q.sort === 'joined' ? b.joinedAt - a.joinedAt : b.lastSeenAt - a.lastSeenAt));
    const start = (q.page - 1) * q.pageSize;
    return { items: filtered.slice(start, start + q.pageSize), total: filtered.length, counts };
  }

  async getMember(id: string): Promise<MemberDetail | undefined> {
    await delay(80);
    const m = this.members.find((x) => x.id === id);
    if (!m) return undefined;
    const now = Date.now();
    const { sanctions } = this.server;
    const r = seeded(Number(id.slice(1)));
    const logs: AccessLog[] = Array.from({ length: 10 }, (_, i) => {
      const client = m.clients[Math.floor(r() * m.clients.length)];
      const flood = m.suspicion?.signal === 'request_flood' || m.suspicion?.signal === 'automation';
      return {
        at: m.lastSeenAt - i * Math.floor((0.3 + r() * 2.5) * DAY),
        client,
        version: client === 'desktop' ? m.appVersion : undefined,
        os: client === 'desktop' ? m.os : client === 'mobile' ? (r() < 0.6 ? 'Android' : 'iOS') : r() < 0.85 ? 'Windows' : 'macOS',
        ip: `${Math.floor(r() * 200 + 20)}.${Math.floor(r() * 250)}.*.*`,
        requestsPerMin: flood && i < 4 ? Math.floor(900 + r() * 700) : Math.floor(12 + r() * 50),
      };
    });
    return {
      member: this.row(m, sanctions, now),
      logs,
      sanctions: sanctions.filter((s) => s.memberId === id).sort((a, b) => b.createdAt - a.createdAt),
    };
  }

  async sanction(input: SanctionInput): Promise<Sanction> {
    await delay();
    const now = Date.now();
    const state = this.server;
    const item: Sanction = {
      id: `S${uid()}`,
      memberId: input.memberId,
      reason: input.reason,
      memo: input.memo.trim(),
      start: now,
      until: input.days === null ? null : now + input.days * DAY,
      createdBy: OPERATOR,
      createdAt: now,
    };
    // 이미 정지 중이면 기존 정지를 새 정지로 바꾼다 (기간 겹침 방지)
    const sanctions = state.sanctions.map((s) =>
      s.memberId === input.memberId && !s.liftedAt && (s.until === null || s.until > now) ? { ...s, liftedAt: now, liftedBy: OPERATOR, liftMemo: '새 정지로 대체' } : s,
    );
    saveServerState({ ...state, sanctions: [item, ...sanctions] });
    return item;
  }

  async liftSanction(sanctionId: string, memo: string) {
    await delay();
    const state = this.server;
    const now = Date.now();
    saveServerState({ ...state, sanctions: state.sanctions.map((s) => (s.id === sanctionId ? { ...s, liftedAt: now, liftedBy: OPERATOR, liftMemo: memo.trim() } : s)) });
  }

  async listSanctions(): Promise<SanctionRow[]> {
    await delay();
    const byId = new Map(this.members.map((m) => [m.id, m]));
    return this.server.sanctions
      .map((s) => ({ ...s, nickname: byId.get(s.memberId)?.nickname ?? '(탈퇴 회원)', toonationId: byId.get(s.memberId)?.toonationId ?? '-' }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async listMaintenances(): Promise<Maintenance[]> {
    await delay(60);
    return [...this.server.maintenances].sort((a, b) => b.start - a.start);
  }

  async saveMaintenance(input: MaintenanceInput, editingId?: string) {
    await delay();
    const now = Date.now();
    const state = this.server;
    const errors = validateMaintenance(input, state.maintenances, now, editingId);
    if (errors.length) return { ok: false as const, errors };
    const prev = state.maintenances.find((m) => m.id === editingId);
    const item: Maintenance = {
      ...input,
      noticeUrl: input.noticeUrl?.trim() || undefined,
      message: input.message.trim(),
      id: prev?.id ?? `P${uid()}`,
      createdBy: prev?.createdBy ?? OPERATOR,
      createdAt: prev?.createdAt ?? now,
    };
    saveServerState({ ...state, maintenances: prev ? state.maintenances.map((m) => (m.id === prev.id ? item : m)) : [item, ...state.maintenances] });
    return { ok: true as const, item };
  }

  async cancelMaintenance(id: string) {
    await delay();
    const state = this.server;
    saveServerState({ ...state, maintenances: state.maintenances.map((m) => (m.id === id ? { ...m, cancelledAt: Date.now() } : m)) });
  }

  async endMaintenanceNow(id: string) {
    await delay();
    const state = this.server;
    const now = Date.now();
    saveServerState({ ...state, maintenances: state.maintenances.map((m) => (m.id === id ? { ...m, end: now, endedEarlyAt: now } : m)) });
  }
}
