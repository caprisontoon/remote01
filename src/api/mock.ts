// 목업 백엔드: 실제 서버 대신 상태를 바꾸고, 후원 유입·통합 알림창 재생·타이머를 흉내 낸다.
import type { DrawSearchQuery, DrawSearchResult, RemoteBackend } from './backend';
import type { Donation, PendingItem, QuickKind } from '../types';
import type { RemoteData } from '../state/data';
import { APP_VERSION } from '../state/data';
import type { Store } from '../state/store';
import { DRAW_SEARCH_LIMIT, LIST_LIMIT, contentText, tabOf } from '../lib/donation';
import { voteDurationSeconds } from '../lib/vote';
import {
  INCOMING_KINDS,
  crewMembers,
  drawHistory,
  initialAds,
  initialDonations,
  initialDrawBoards,
  makeDonation,
  makePending,
  pick,
  rand,
  uid,
} from './mockData';

const HELP = 'https://help.toon.at/hc/ko';

export function initialData(now = Date.now()): RemoteData {
  return {
    session: { phase: 'splash', showAd: false },
    notice: { text: '[이벤트 수상] 2025 투네이션 어워드 수상자 발표', url: `${HELP}/articles/award-2025` },
    alarms: [
      { id: 'n1', title: '[점검] 1월 3일(수) 임시 점검 안내', url: `${HELP}/articles/maintenance`, createdAt: now - 3600e3, read: false },
      { id: 'n2', title: '[업데이트] 리모컨 2.0 출시 안내', url: `${HELP}/articles/remocon-2`, createdAt: now - 86400e3, read: false },
      { id: 'n3', title: '[정산] 12월 정산 일정 안내', url: `${HELP}/articles/settlement`, createdAt: now - 3 * 86400e3, read: true },
    ],
    donations: initialDonations(now),
    playingIds: [],
    blockedDonors: [],
    unseen: { all: 0, game: 0, draw: 0 },
    pending: [makePending('quest', now), makePending('luckybox', now), makePending('play', now)],
    paused: { alert: false, drawing: false, draw: false },
    volume: { tts: 75, video: 60, voice: 75, roulette: 50, luckybox: 75, play: 75, draw: 75 },
    usageMaster: true,
    usage: { text: true, mini: true, voice: true, video: true, roulette: true, quest: true, drawing: false, gift: true, luckybox: true, play: true, signature: true, game: true, crew: false },
    alerts: { toneAd: true, ytSuperchat: true, ytMembership: true, chzzkCheese: true, chzzkSubscribe: true, twitchBits: true, twitchSubscribe: true, twitchGiftSub: true, twitchGiftSubCount: false, twitchRaid: true, toonation: true },
    video: { autoplay: false, audioOnly: false },
    drawBoards: initialDrawBoards(),
    votePresets: [
      { name: '프리미어리그 우승팀은?', items: ['맨시티', '아스날', '리버풀'], price: 1000, freeTickets: 1, seconds: 600 },
      { name: '오늘 점심 뭐 먹지?', items: ['짜장면', '짬뽕', '탕수육'], price: 1000, freeTickets: 0, seconds: 300 },
    ],
    vote: { status: 'idle' },
    crew: { season: '오프오프 시즌', title: '마지막 직급 대전', members: crewMembers() },
    ads: initialAds(),
    adAutoPlay: false,
    wallpaper: [],
    toasts: [],
    version: APP_VERSION,
  };
}

const params = () => new URLSearchParams(typeof location === 'undefined' ? '' : location.search);

export class MockBackend implements RemoteBackend {
  private history: Donation[];
  private playQueue: string[] = [];
  private playingUntil = 0;
  private timers: ReturnType<typeof setInterval>[] = [];
  private toastSeq = 1;

  constructor(private store: Store<RemoteData>) {
    this.history = drawHistory(Date.now(), 1200);
  }

  private get d() {
    return this.store.get();
  }
  private set(patch: Partial<RemoteData> | ((s: RemoteData) => Partial<RemoteData>)) {
    this.store.set(patch);
  }

  // ------------------------------------------------------------------ 세션

  /** 스플래시 → (점검/업데이트) → 로그인 또는 바로 리모컨. ?maintenance=1, ?update=1, ?expired=1 로 각 화면을 확인할 수 있다. */
  boot(remembered: boolean) {
    const p = params();
    setTimeout(() => {
      if (p.get('maintenance') === '1') return this.setPhase('maintenance');
      if (p.get('update') === '1') return this.setPhase('update');
      if (p.get('expired') === '1') return this.setPhase('expired');
      if (remembered || p.get('autologin') === '1') return this.enter('통합 로그인');
      this.setPhase('login');
    }, p.get('fast') === '1' ? 0 : 1400);
  }

  private setPhase(phase: RemoteData['session']['phase']) {
    this.set((s) => ({ session: { ...s.session, phase } }));
  }

  private enter(loginMethod: string) {
    const hideAdUntil = Number(safeGet('toona.adHiddenUntil') ?? 0);
    this.set((s) => ({
      session: { ...s.session, phase: 'ready', user: { nickname: '피곤한고양이', loginMethod }, showAd: Date.now() > hideAdUntil && params().get('ad') !== '0' },
    }));
    this.start();
  }

  async login(id: string, password: string, keep: boolean) {
    await delay(400);
    if (!id || !password) return { ok: false as const, reason: 'mismatch' as const };
    if (password === 'fail') return { ok: false as const, reason: 'mismatch' as const };
    if (keep) safeSet('toona.keepLogin', '1');
    if (id.includes('multi')) {
      this.set((s) => ({ session: { ...s.session, phase: 'accounts', accounts: [{ id: 'a1', nickname: '피곤한고양이' }, { id: 'a2', nickname: '피곤한고양이_서브' }] } }));
    } else {
      this.enter('통합 로그인');
    }
    return { ok: true as const };
  }

  async loginWithSns(provider: string) {
    await delay(600);
    this.enter(`${provider} 로그인`);
    return { ok: true as const };
  }

  selectAccount() {
    this.enter('통합 로그인');
  }

  logout() {
    safeRemove('toona.keepLogin');
    this.stop();
    this.set((s) => ({ session: { ...s.session, phase: 'login', user: undefined, showAd: false } }));
  }

  installUpdate() {
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + 12);
      this.set((s) => ({ session: { ...s.session, updateProgress: p } }));
      if (p >= 100) {
        clearInterval(t);
        setTimeout(() => this.setPhase(safeGet('toona.keepLogin') ? 'ready' : 'login'), 500);
        if (safeGet('toona.keepLogin')) this.enter('통합 로그인');
      }
    }, 250);
  }

  retryMaintenance() {
    this.setPhase('login');
  }

  dismissAd(hideToday: boolean) {
    if (hideToday) {
      const end = new Date();
      end.setHours(24, 0, 0, 0);
      safeSet('toona.adHiddenUntil', String(end.getTime()));
    }
    this.set((s) => ({ session: { ...s.session, showAd: false } }));
  }

  setNotice(notice: RemoteData['notice']) {
    this.set({ notice });
  }

  // ------------------------------------------------------------------ 시뮬레이터

  private start() {
    if (this.timers.length) return;
    this.timers.push(setInterval(() => this.incoming(), 7000));
    this.timers.push(setInterval(() => this.tick(), 1000));
    this.timers.push(setInterval(() => this.incomingPending(), 25000));
  }

  private stop() {
    this.timers.forEach(clearInterval);
    this.timers = [];
  }

  private incoming() {
    const kind = pick(INCOMING_KINDS);
    const now = Date.now();
    // 뽑기 10연차: 한 번에 여러 행이 들어오고 함께 재생된다 (p43 ※)
    const burst = kind === 'draw' && rand() > 0.7 ? 10 : 1;
    const fresh = Array.from({ length: burst }, () => makeDonation(kind, now));
    if (kind === 'draw' && burst > 1) {
      const who = { donorId: fresh[0].donorId, nickname: fresh[0].nickname, account: fresh[0].account, title: fresh[0].title };
      fresh.forEach((d) => Object.assign(d, who));
    }
    // 영상 자동 재생 OFF면 영상 후원은 대기 중인 후원으로 간다 (p14 ③, p72)
    if (kind === 'video' && !this.d.video.autoplay) {
      const p = makePending('video', now);
      this.set((s) => ({ pending: [...s.pending, p] }));
      return;
    }
    this.addToList(fresh, true);
  }

  private incomingPending() {
    if (this.d.pending.length >= 6) return;
    const p = makePending(pick(['quest', 'luckybox', 'play'] as const), Date.now());
    this.set((s) => ({ pending: [...s.pending, p] }));
  }

  /** 리스트에 추가하고, 통합 알림창 재생 큐에 넣는다. 탭별 최근 100건만 유지 (p41 ③). */
  private addToList(items: Donation[], queue: boolean) {
    const tab = tabOf(items[0].kind);
    this.set((s) => {
      const merged = [...items, ...s.donations];
      const kept: Donation[] = [];
      const count = { all: 0, game: 0, draw: 0 };
      for (const d of merged.sort((a, b) => b.createdAt - a.createdAt)) {
        const t = tabOf(d.kind);
        if (count[t] < LIST_LIMIT) {
          kept.push(d);
          count[t]++;
        }
      }
      return { donations: kept, unseen: { ...s.unseen, [tab]: s.unseen[tab] + items.length } };
    });
    if (queue && !this.d.blockedDonors.includes(items[0].donorId)) this.playQueue.push(items.map((d) => d.id).join(','));
  }

  private tick() {
    const now = Date.now();
    // 통합 알림창 재생 싱크 (p43): 한 번에 한 묶음씩 재생
    if (this.d.playingIds.length && now >= this.playingUntil) this.set({ playingIds: [] });
    if (!this.d.playingIds.length && this.playQueue.length && !this.d.paused.alert) {
      const next = this.playQueue.shift()!.split(',');
      const first = this.d.donations.find((d) => d.id === next[0]);
      const paused = first?.kind === 'draw' ? this.d.paused.draw : first?.kind === 'drawing' ? this.d.paused.drawing : false;
      if (paused) {
        this.playQueue.unshift(next.join(','));
      } else if (first) {
        this.playingUntil = now + 6000;
        this.set({ playingIds: next });
      }
    }
    this.expirePending(now);
    this.tickVote(now);
  }

  private expirePending(now: number) {
    const expired = this.d.pending.filter((p) => p.deadline <= now);
    if (!expired.length) return;
    const toList: Donation[] = [];
    for (const p of expired) {
      // 수락 전 시간 초과 → 자동 환불, 리스트에 남지 않음 (p65 ①, p67 ①)
      if (p.kind === 'quest' && p.accepted) toList.push(this.pendingToDonation(p, { result: 'fail' }));
      if (p.kind === 'luckybox') toList.push(this.pendingToDonation(p, { result: 'timeout' }));
      if (p.kind === 'play' && p.challenging) toList.push(this.pendingToDonation(p, { result: 'wrong' }));
    }
    this.set((s) => ({ pending: s.pending.filter((p) => p.deadline > now) }));
    if (toList.length) this.addToList(toList, false);
  }

  private pendingToDonation(p: PendingItem, extra: Partial<Donation>): Donation {
    const base: Donation = { id: uid('don'), kind: p.kind, donorId: p.donorId, nickname: p.nickname, account: p.account, cash: p.cash, createdAt: Date.now() };
    if (p.kind === 'quest') return { ...base, title: p.title, ...extra };
    if (p.kind === 'play') return { ...base, title: p.mode === 'choice' ? '객관식' : p.mode === 'initial' ? '초성' : '그림', ...extra };
    if (p.kind === 'video') return { ...base, platform: p.platform, title: p.title, thumbnail: p.thumbnail, url: p.url, ...extra };
    return { ...base, ...extra };
  }

  // ------------------------------------------------------------------ 알림

  readAlarm(id: string) {
    this.set((s) => ({ alarms: s.alarms.map((a) => (a.id === id ? { ...a, read: true } : a)) }));
  }
  readAllAlarms() {
    this.set((s) => ({ alarms: s.alarms.map((a) => ({ ...a, read: true })) }));
  }

  // ------------------------------------------------------------------ 후원 리스트

  replay(id: string) {
    const d = this.d.donations.find((x) => x.id === id);
    if (!d) return;
    this.playQueue.unshift(id);
    this.toast(`다시 재생합니다: ${d.nickname} · ${contentText(d).slice(0, 20)}`);
  }

  block(donorId: string) {
    // 영상 상태 유지 OFF → 대기 중이던 영상 후원은 거절 처리되어 리스트로 (p14 ③)
    const rejected = readSettingsKeepVideo() ? [] : this.d.pending.filter((p) => p.kind === 'video' && p.donorId === donorId);
    this.set((s) => ({
      blockedDonors: s.blockedDonors.includes(donorId) ? s.blockedDonors : [...s.blockedDonors, donorId],
      pending: s.pending.filter((p) => !rejected.includes(p)),
    }));
    if (rejected.length) this.addToList(rejected.map((p) => this.pendingToDonation(p, {})), false);
  }

  unblock(donorId: string) {
    this.set((s) => ({ blockedDonors: s.blockedDonors.filter((d) => d !== donorId) }));
  }

  registerWallpaper(id: string) {
    if (this.d.wallpaper.includes(id)) return this.toast('이미 벽지에 등록된 후원입니다.');
    this.set((s) => ({ wallpaper: [id, ...s.wallpaper] }));
    this.toast('벽지에 등록했습니다.');
  }

  removeWallpaper(id: string) {
    this.set((s) => ({ wallpaper: s.wallpaper.filter((w) => w !== id) }));
  }

  markSeen(tab: 'all' | 'game' | 'draw') {
    if (this.d.unseen[tab] === 0) return;
    this.set((s) => ({ unseen: { ...s.unseen, [tab]: 0 } }));
  }

  completeDraws(ids: string[]) {
    this.set((s) => ({ donations: s.donations.map((d) => (ids.includes(d.id) ? { ...d, completed: true } : d)) }));
  }

  async searchDraws(q: DrawSearchQuery): Promise<DrawSearchResult> {
    await delay(250);
    const from = q.from ? Date.parse(`${q.from}T00:00:00`) : 0;
    const to = q.to ? Date.parse(`${q.to}T23:59:59`) : Infinity;
    const board = q.boardId === 'all' ? null : this.d.drawBoards.find((b) => b.id === q.boardId)?.name;
    const kw = q.keyword.trim().toLowerCase();
    const all = [...this.d.donations.filter((d) => d.kind === 'draw'), ...this.history];
    const hits = all
      .filter((d) => d.createdAt >= from && d.createdAt <= to)
      .filter((d) => !board || d.title === board)
      .filter((d) => {
        if (!kw) return true;
        const nick = `${d.nickname} ${d.account}`.toLowerCase();
        const prize = (d.item ?? '').toLowerCase();
        const cash = String(d.cash);
        if (q.field === 'nickname') return nick.includes(kw);
        if (q.field === 'cash') return cash === kw.replace(/,/g, '');
        if (q.field === 'prize') return prize.includes(kw);
        return nick.includes(kw) || prize.includes(kw) || cash === kw.replace(/,/g, '');
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    return { items: hits.slice(0, DRAW_SEARCH_LIMIT), overLimit: hits.length > DRAW_SEARCH_LIMIT };
  }

  // ------------------------------------------------------------------ 퀵 제어

  togglePause(kind: QuickKind) {
    this.set((s) => ({ paused: { ...s.paused, [kind]: !s.paused[kind] } }));
  }

  skip(kind: QuickKind) {
    const playing = this.d.donations.filter((d) => this.d.playingIds.includes(d.id));
    const matches = playing.some((d) => (kind === 'draw' ? d.kind === 'draw' : kind === 'drawing' ? d.kind === 'drawing' : true));
    if (!playing.length || !matches) return this.toast('지금 재생 중인 알림이 없습니다.');
    this.playingUntil = 0;
    this.set({ playingIds: [] });
  }

  // ------------------------------------------------------------------ 대기 중인 후원

  private removePending(id: string) {
    const p = this.d.pending.find((x) => x.id === id);
    this.set((s) => ({ pending: s.pending.filter((x) => x.id !== id) }));
    return p;
  }

  acceptPending(id: string) {
    const p = this.d.pending.find((x) => x.id === id);
    if (!p) return;
    if (p.kind === 'quest') {
      // 수락 → 버튼이 성공/실패로 바뀌고 미션 시간이 시작된다 (p65 ③⑤)
      this.set((s) => ({ pending: s.pending.map((x) => (x.id === id ? { ...x, accepted: true, deadline: Date.now() + 120_000 } : x)) }));
      return;
    }
    if (p.kind === 'video') {
      this.removePending(id);
      this.addToList([this.pendingToDonation(p, {})], true);
    }
  }

  rejectPending(id: string) {
    const p = this.removePending(id);
    // 퀘스트 거절은 리스트에 남지 않는다 (p65 ④). 영상은 수락/거절 모두 리스트에 노출 (p64 ②)
    if (p?.kind === 'video') this.addToList([this.pendingToDonation(p, {})], false);
  }

  resolveQuest(id: string, success: boolean) {
    const p = this.removePending(id);
    if (p) this.addToList([this.pendingToDonation(p, { result: success ? 'success' : 'fail' })], true);
  }

  pickLuckyBox(id: string, box: number) {
    const p = this.removePending(id);
    if (p) this.addToList([this.pendingToDonation(p, { result: (box + p.cash) % 3 === 0 ? 'win' : 'lose' })], true);
  }

  startPlay(id: string) {
    this.set((s) => ({
      pending: s.pending.map((x) => (x.id === id && x.kind === 'play' && !x.challenging ? { ...x, challenging: true, deadline: Date.now() + x.limitSeconds * 1000 } : x)),
    }));
  }

  submitPlay(id: string, answer: string) {
    const p = this.removePending(id);
    if (!p || p.kind !== 'play') return;
    const correct = p.mode === 'choice' ? answer === '2016' : answer.trim() === '리모컨';
    this.addToList([this.pendingToDonation(p, { result: correct ? 'correct' : 'wrong' })], true);
    this.toast(correct ? '정답입니다!' : '오답입니다.');
  }

  giveUpPlay(id: string) {
    const p = this.removePending(id);
    if (p) this.addToList([this.pendingToDonation(p, { result: 'wrong' })], false);
  }

  // ------------------------------------------------------------------ 제어 위젯

  setVolume(key: keyof RemoteData['volume'], value: number) {
    this.set((s) => ({ volume: { ...s.volume, [key]: Math.max(0, Math.min(100, Math.round(value))) } }));
  }
  setUsageMaster(on: boolean) {
    this.set({ usageMaster: on });
  }
  setUsage(key: keyof RemoteData['usage'], on: boolean) {
    this.set((s) => ({ usage: { ...s.usage, [key]: on } }));
  }
  setAlert(key: keyof RemoteData['alerts'], on: boolean) {
    this.set((s) => ({ alerts: { ...s.alerts, [key]: on } }));
  }
  setVideo(patch: Partial<RemoteData['video']>) {
    this.set((s) => ({ video: { ...s.video, ...patch } }));
  }

  // ------------------------------------------------------------------ 투표

  startVote(form: NonNullable<RemoteData['vote']['form']>) {
    const seconds = voteDurationSeconds(form) ?? 60;
    if (form.reserve) {
      this.set({ vote: { status: 'reserved', form, reservedAt: Date.parse(form.reserveAt), remainingMs: seconds * 1000 } });
      return;
    }
    const now = Date.now();
    this.set({ vote: { status: 'running', form, startedAt: now, endsAt: now + seconds * 1000 } });
  }

  private tickVote(now: number) {
    const v = this.d.vote;
    if (v.status === 'reserved' && v.reservedAt && now >= v.reservedAt) {
      this.set({ vote: { ...v, status: 'running', startedAt: now, endsAt: now + (v.remainingMs ?? 60_000), reservedAt: undefined, remainingMs: undefined } });
    } else if (v.status === 'running' && v.endsAt && now >= v.endsAt) {
      this.set({ vote: { status: 'idle' } });
      this.toast('투표가 종료되었습니다.');
    }
  }

  pauseVote() {
    const v = this.d.vote;
    if (v.status !== 'running' || !v.endsAt) return;
    this.set({ vote: { ...v, status: 'paused', remainingMs: v.endsAt - Date.now(), endsAt: undefined } });
  }
  resumeVote() {
    const v = this.d.vote;
    if (v.status !== 'paused') return;
    this.set({ vote: { ...v, status: 'running', endsAt: Date.now() + (v.remainingMs ?? 0), remainingMs: undefined } });
  }
  endVote() {
    this.set({ vote: { status: 'idle' } });
  }
  extendVote(seconds: number) {
    const v = this.d.vote;
    if (v.status === 'running' && v.endsAt) this.set({ vote: { ...v, endsAt: Math.max(Date.now() + 1000, v.endsAt + seconds * 1000) } });
    if (v.status === 'paused') this.set({ vote: { ...v, remainingMs: Math.max(1000, (v.remainingMs ?? 0) + seconds * 1000) } });
  }

  // ------------------------------------------------------------------ 크루 후원

  startCrew() {
    this.set((s) => ({ crew: { ...s.crew, liveSince: Date.now(), result: undefined } }));
  }
  endCrew() {
    const c = this.d.crew;
    const ranking = [...c.members].sort((a, b) => b.score - a.score);
    this.set({
      crew: {
        ...c,
        liveSince: undefined,
        result: { title: `[${c.season}] ${c.title}`, startedAt: c.liveSince ?? Date.now(), endedAt: Date.now(), ranking, totalCash: ranking.reduce((n, m) => n + m.score, 0) },
      },
    });
  }
  closeCrewResult() {
    this.set((s) => ({ crew: { ...s.crew, result: undefined } }));
  }

  // ------------------------------------------------------------------ 투네애드

  playAd(id: string) {
    const ad = this.d.ads.find((a) => a.id === id);
    if (!ad || ad.playedAt) return;
    if (!ad.playable) return this.toast('재생이 가능하지 않은 상태 입니다.', 'error');
    this.toast(`광고를 재생합니다: ${ad.title}`);
    this.set((s) => ({ ads: s.ads.map((a) => (a.id === id ? { ...a, playedAt: Date.now() } : a)) }));
  }
  skipAd(id: string) {
    this.set((s) => ({ ads: s.ads.filter((a) => a.id !== id) }));
  }
  setAdAutoPlay(on: boolean) {
    this.set({ adAutoPlay: on });
  }

  // ------------------------------------------------------------------ 토스트

  toast(message: string, tone: 'info' | 'error' = 'info', durationMs = 2500) {
    const id = this.toastSeq++;
    this.set((s) => ({ toasts: [...s.toasts, { id, message, tone, durationMs }] }));
    setTimeout(() => this.dismissToast(id), durationMs);
  }
  dismissToast(id: number) {
    this.set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 저장소를 못 쓰는 환경 */
  }
}
function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}
function readSettingsKeepVideo(): boolean {
  try {
    const raw = localStorage.getItem('toona.settings');
    return raw ? JSON.parse(raw).keepVideoOnBlock !== false : true;
  } catch {
    return true;
  }
}
