import type { AlertKey, Donation, Notice, QuickKind, UsageKey, VolumeKey, VoteForm } from '../types';
import type { LiveStatus } from './toonation';

export interface DrawSearchQuery {
  boardId: string | 'all';
  from: string; // YYYY-MM-DD
  to: string;
  field: 'all' | 'nickname' | 'cash' | 'prize';
  keyword: string;
}

export interface DrawSearchResult {
  /** 최근 순, 최대 1,000건 */
  items: Donation[];
  /** 1,000건 초과 여부 (p49 ②) */
  overLimit: boolean;
}

/**
 * 리모컨이 서버에 요청하는 동작 목록.
 * 지금은 MockBackend가 구현한다. 실제 투네이션 서버 연동 시 같은 인터페이스로 구현체만 교체한다.
 * (기존 설치형 리모컨 분석 결과가 나오면 엔드포인트·소켓 이벤트를 여기에 매핑한다.)
 */
export interface RemoteBackend {
  // 세션
  login(id: string, password: string, keep: boolean): Promise<{ ok: true } | { ok: false; reason: 'mismatch' | 'failed' }>;
  loginWithSns(provider: string): Promise<{ ok: true } | { ok: false; reason: 'failed' }>;
  selectAccount(accountId: string): void;
  logout(): void;
  installUpdate(): void;
  retryMaintenance(): void;
  /** 이용 정지 화면에서 로그아웃 */
  leaveSuspended(): void;
  dismissAd(hideToday: boolean): void;
  setNotice(notice: Notice): void;

  // 알림
  readAlarm(id: string): void;
  readAllAlarms(): void;

  // 후원 리스트
  replay(donationId: string): void;
  block(donorId: string): void;
  unblock(donorId: string): void;
  registerWallpaper(donationId: string): void;
  removeWallpaper(donationId: string): void;
  markSeen(tab: 'all' | 'game' | 'draw'): void;
  completeDraws(ids: string[]): void;
  searchDraws(query: DrawSearchQuery): Promise<DrawSearchResult>;

  // 퀵 제어
  togglePause(kind: QuickKind): void;
  skip(kind: QuickKind): void;

  // 대기 중인 후원
  acceptPending(id: string): void;
  rejectPending(id: string): void;
  resolveQuest(id: string, success: boolean): void;
  pickLuckyBox(id: string, box: number): void;
  startPlay(id: string): void;
  submitPlay(id: string, answer: string): void;
  giveUpPlay(id: string): void;

  // 제어
  setVolume(key: VolumeKey, value: number): void;
  setUsageMaster(on: boolean): void;
  setUsage(key: UsageKey, on: boolean): void;
  setAlert(key: AlertKey, on: boolean): void;
  setVideo(patch: Partial<{ autoplay: boolean; audioOnly: boolean }>): void;

  // 투표
  startVote(form: VoteForm): void;
  pauseVote(): void;
  resumeVote(): void;
  endVote(): void;
  extendVote(seconds: number): void;

  // 크루 후원
  startCrew(): void;
  endCrew(): void;
  closeCrewResult(): void;

  // 투네애드
  playAd(id: string): void;
  skipAd(id: string): void;
  setAdAutoPlay(on: boolean): void;

  // 실시간 후원 수신 (투네이션 알림창 웹소켓)
  setLiveStatus(status: LiveStatus): void;
  ingestLive(donation: Donation): void;

  toast(message: string, tone?: 'info' | 'error', durationMs?: number): void;
  dismissToast(id: number): void;
}

export type BackendMethod = keyof RemoteBackend;
