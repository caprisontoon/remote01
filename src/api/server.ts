// 관리자 웹이 정하고 리모컨이 따르는 운영 정보: 점검 일정과 회원 제재.
// 실제 서버가 생기면 리모컨은 이 값을 서버에서 받는다. 지금은 목업이라 같은 브라우저의 localStorage를
// "서버"로 써서, 관리자 웹(/admin/)에서 바꾼 값이 같은 브라우저의 웹 리모컨에 바로 반영된다.
// (설치형은 저장소가 따로라 실서버 연동 전까지 관리자 웹 설정을 받지 못한다.)

/** 리모컨 이용 환경 */
export type Client = 'desktop' | 'web' | 'mobile';

export const CLIENT_LABEL: Record<Client, string> = {
  desktop: '설치형',
  web: 'PC 웹',
  mobile: '모바일 웹',
};

export interface Maintenance {
  id: string;
  start: number;
  end: number;
  /** 점검 화면을 띄울 이용 환경 */
  targets: Client[];
  /** 점검 화면에 나오는 안내 문구 */
  message: string;
  /** 점검 공지 링크 (선택) */
  noticeUrl?: string;
  /** 시작 전 리모컨 상단 공지 바에 예고를 띄우는 시간(분). 0이면 예고 없음 */
  noticeLeadMinutes: number;
  createdBy: string;
  createdAt: number;
  /** 시작 전에 취소함 */
  cancelledAt?: number;
  /** 진행 중에 조기 종료함 (end를 이 시각으로 당긴다) */
  endedEarlyAt?: number;
}

export type MaintenanceStatus = 'scheduled' | 'active' | 'done' | 'cancelled';

export const MAINTENANCE_STATUS_LABEL: Record<MaintenanceStatus, string> = {
  scheduled: '예정',
  active: '진행 중',
  done: '종료',
  cancelled: '취소',
};

export function maintenanceStatus(m: Maintenance, now: number): MaintenanceStatus {
  if (m.cancelledAt) return 'cancelled';
  if (now < m.start) return 'scheduled';
  if (now < m.end) return 'active';
  return 'done';
}

/** 지금 이 이용 환경에 걸린 점검 (여러 개면 가장 늦게 끝나는 것) */
export function activeMaintenance(list: Maintenance[], client: Client, now: number): Maintenance | undefined {
  return list
    .filter((m) => m.targets.includes(client) && maintenanceStatus(m, now) === 'active')
    .sort((a, b) => b.end - a.end)[0];
}

/** 예고 시간 안에 들어온 다음 점검 */
export function upcomingMaintenance(list: Maintenance[], client: Client, now: number): Maintenance | undefined {
  return list
    .filter((m) => m.targets.includes(client) && maintenanceStatus(m, now) === 'scheduled' && m.noticeLeadMinutes > 0 && m.start - now <= m.noticeLeadMinutes * 60_000)
    .sort((a, b) => a.start - b.start)[0];
}

export const DEFAULT_MAINTENANCE_MESSAGE = '더 안정적인 서비스를 위해 점검을 진행하고 있습니다.\n점검 시간 동안 리모컨을 이용할 수 없습니다.';

export interface MaintenanceInput {
  start: number;
  end: number;
  targets: Client[];
  message: string;
  noticeUrl?: string;
  noticeLeadMinutes: number;
}

/** 점검 일정 입력 검사. 문제가 없으면 빈 배열 */
export function validateMaintenance(input: MaintenanceInput, others: Maintenance[], now: number, editingId?: string): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(input.start) || !Number.isFinite(input.end)) errors.push('시작·종료 일시를 입력해 주세요.');
  else {
    if (input.end <= input.start) errors.push('종료 일시는 시작 일시보다 뒤여야 합니다.');
    if (input.end <= now) errors.push('종료 일시가 이미 지났습니다.');
  }
  if (input.targets.length === 0) errors.push('점검할 이용 환경을 하나 이상 골라 주세요.');
  if (!input.message.trim()) errors.push('안내 문구를 입력해 주세요.');
  if (input.noticeUrl && !/^https?:\/\//.test(input.noticeUrl)) errors.push('공지 링크는 http:// 또는 https://로 시작해야 합니다.');
  const clash = others.find(
    (m) =>
      m.id !== editingId &&
      !m.cancelledAt &&
      m.end > now &&
      m.start < input.end &&
      input.start < m.end &&
      m.targets.some((t) => input.targets.includes(t)),
  );
  if (clash) errors.push(`다른 점검 일정과 시간이 겹칩니다. (${formatRange(clash.start, clash.end)})`);
  return errors;
}

// ------------------------------------------------------------------ 제재

export type SanctionReason = 'request_flood' | 'tampered_client' | 'automation' | 'account_sharing' | 'other';

export const SANCTION_REASON_LABEL: Record<SanctionReason, string> = {
  request_flood: '비정상 요청 반복 (어뷰징)',
  tampered_client: '변조된 클라이언트 사용',
  automation: '자동화 프로그램(매크로) 사용',
  account_sharing: '계정 공유·비정상 다중 접속',
  other: '기타 운영 정책 위반',
};

export interface Sanction {
  id: string;
  memberId: string;
  reason: SanctionReason;
  /** 운영자만 보는 메모 */
  memo: string;
  start: number;
  /** null = 영구 정지 */
  until: number | null;
  createdBy: string;
  createdAt: number;
  liftedAt?: number;
  liftedBy?: string;
  liftMemo?: string;
}

export type SanctionStatus = 'active' | 'expired' | 'lifted';

export const SANCTION_STATUS_LABEL: Record<SanctionStatus, string> = {
  active: '정지 중',
  expired: '기간 만료',
  lifted: '해제',
};

export function sanctionStatus(s: Sanction, now: number): SanctionStatus {
  if (s.liftedAt) return 'lifted';
  if (s.until !== null && now >= s.until) return 'expired';
  return 'active';
}

export function activeSanction(list: Sanction[], memberId: string, now: number): Sanction | undefined {
  return list
    .filter((s) => s.memberId === memberId && s.start <= now && sanctionStatus(s, now) === 'active')
    .sort((a, b) => (b.until ?? Infinity) - (a.until ?? Infinity))[0];
}

// ------------------------------------------------------------------ 표기

const pad = (n: number) => String(n).padStart(2, '0');

/** 2026.10.24 (토) 02:00 */
export function formatDateTime(t: number, withDay = true) {
  const d = new Date(t);
  const day = '일월화수목금토'[d.getDay()];
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}${withDay ? ` (${day})` : ''} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 같은 날이면 끝 시각만 쓴다: 2026.10.24 (토) 02:00 ~ 06:00 */
export function formatRange(start: number, end: number) {
  const a = new Date(start);
  const b = new Date(end);
  const sameDay = a.toDateString() === b.toDateString();
  return `${formatDateTime(start)} ~ ${sameDay ? `${pad(b.getHours())}:${pad(b.getMinutes())}` : formatDateTime(end)}`;
}

// ------------------------------------------------------------------ 목업 서버 저장소

export interface ServerState {
  maintenances: Maintenance[];
  sanctions: Sanction[];
}

const KEY = 'toona.mockServer';

export function loadServerState(): ServerState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<ServerState>;
      return { maintenances: s.maintenances ?? [], sanctions: s.sanctions ?? [] };
    }
  } catch {
    /* 저장소를 못 쓰는 환경 */
  }
  return { maintenances: [], sanctions: [] };
}

export function saveServerState(state: ServerState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

/** 다른 탭(관리자 웹)에서 바뀌면 알려 준다 */
export function onServerStateChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const h = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener('storage', h);
  return () => window.removeEventListener('storage', h);
}

/** 리모컨 목업에 로그인하는 회원 (관리자 웹 회원 목록 맨 위에 있다) */
export const DEMO_MEMBER_ID = 'M100001';
