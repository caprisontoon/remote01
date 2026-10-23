import type {
  Alarm,
  AlertKey,
  CrewState,
  Donation,
  DrawBoard,
  Notice,
  PendingItem,
  QuickKind,
  Settings,
  ToneAd,
  Toast,
  UsageKey,
  VolumeKey,
  VoteState,
} from '../types';
import { FILTER_KINDS } from '../lib/donation';
import type { LiveStatus } from '../api/toonation';
import type { MaintenanceInfo, SuspendedInfo } from '../components/StatusScreens';

export type SessionPhase = 'splash' | 'maintenance' | 'update' | 'login' | 'accounts' | 'expired' | 'suspended' | 'ready';

export interface Session {
  phase: SessionPhase;
  user?: { nickname: string; loginMethod: string; avatar?: string };
  accounts?: { id: string; nickname: string }[];
  updateProgress?: number;
  showAd: boolean;
  /** 관리자 웹에서 정한 점검 (점검 화면에 기간·문구를 보여 준다) */
  maintenance?: MaintenanceInfo;
  /** 관리자 웹에서 건 이용 정지 */
  suspended?: SuspendedInfo;
}

/** 백엔드에서 오는(=모든 창이 공유하는) 상태. */
export interface RemoteData {
  session: Session;
  notice: Notice;
  alarms: Alarm[];
  donations: Donation[];
  /** 통합 알림창에서 지금 재생 중인 후원 id (뽑기 10연차는 여러 개) */
  playingIds: string[];
  blockedDonors: string[];
  /** 탭별 미확인 후원 수 (p42 ⑤) */
  unseen: { all: number; game: number; draw: number };
  pending: PendingItem[];
  paused: Record<QuickKind, boolean>;
  volume: Record<VolumeKey, number>;
  usageMaster: boolean;
  usage: Record<UsageKey, boolean>;
  alerts: Record<AlertKey, boolean>;
  video: { autoplay: boolean; audioOnly: boolean };
  drawBoards: DrawBoard[];
  votePresets: { name: string; items: string[]; price: number; freeTickets: number; seconds: number }[];
  vote: VoteState;
  crew: CrewState;
  ads: ToneAd[];
  adAutoPlay: boolean;
  wallpaper: string[];
  toasts: Toast[];
  version: string;
  /** 투네이션 실시간 후원 수신 상태 */
  live: LiveStatus;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark', // 시안 2: 다크가 기본
  textScale: 100,
  language: 'ko',
  showBlockButton: true,
  keepVideoOnBlock: true,
  shortcuts: [],
  dockPinned: true,
  filters: FILTER_KINDS,
  sort: 'recent',
  columnWidths: {},
  liveAlertbox: '',
};

export const APP_VERSION = '2.0.0';
