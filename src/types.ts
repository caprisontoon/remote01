// 리모컨 도메인 타입. 기획서 「리모컨 개편_상세기획 v0.21」 기준.

/** 캔버스에 놓이는 위젯. 후원 리스트를 제외한 10개는 Dock 정렬 순서(기획서 p10)를 따른다. */
export type WidgetId =
  | 'donations'
  | 'quick'
  | 'pending'
  | 'volume'
  | 'usage'
  | 'alerts'
  | 'video'
  | 'drawRemain'
  | 'vote'
  | 'crew'
  | 'toneAd';

/** 캔버스 좌표. 0~1 비율 값이라 창 크기가 바뀌어도 위젯 비율이 유지된다(p18 유동형 비율 캔버스). */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Tiles = Partial<Record<WidgetId, Rect>>;

export type DockDirection = 'top' | 'bottom' | 'left' | 'right' | 'center';
export type CanvasEdge = 'top' | 'bottom' | 'left' | 'right';

/** 드래그 중 놓일 위치. 도킹 인디케이터(위젯 위) 또는 엣지 인디케이터(캔버스 가장자리). */
export type DropTarget =
  | { kind: 'dock'; target: WidgetId; dir: DockDirection }
  | { kind: 'edge'; edge: CanvasEdge };

export interface Preset {
  id: string;
  name: string;
  tiles: Tiles;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// 후원

/** 통합 알림/게임/뽑기 리스트에 들어오는 알림 종류 (p39 알림 리스트 노출 정책). */
export type DonationKind =
  | 'text'
  | 'game'
  | 'signature'
  | 'mini'
  | 'voice'
  | 'video'
  | 'roulette'
  | 'wishlist'
  | 'vote'
  | 'quest'
  | 'drawing'
  | 'gift'
  | 'luckybox'
  | 'play'
  | 'draw'
  | 'creatorTts'
  | 'ytSubscribe'
  | 'ytSuperchat'
  | 'ytMembership'
  | 'chzzkSubscribe'
  | 'chzzkCheese'
  | 'twitchSubscribe'
  | 'twitchFollow'
  | 'twitchBits'
  | 'twitchGiftSub'
  | 'twitchGiftSubCount'
  | 'twitchRaid';

/** 퀘스트/럭키박스/플레이 결과. 결과에 따라 노출 문구와 버튼이 달라진다. */
export type DonationResult = 'success' | 'fail' | 'win' | 'lose' | 'timeout' | 'correct' | 'wrong';

export interface Donation {
  id: string;
  kind: DonationKind;
  result?: DonationResult;
  donorId: string;
  nickname: string;
  /** 마스킹된 계정 (예: 00loo***@gmail.com) */
  account: string;
  /** 후원 캐시. 게임 후원은 아이템 금액(원). */
  cash: number;
  createdAt: number;
  text?: string;
  title?: string;
  /** 룰렛 상품, 투표 항목, 뽑기 상품 등 */
  item?: string;
  platform?: string;
  thumbnail?: string;
  url?: string;
  quantity?: number;
  months?: number;
  amountLabel?: string;
  game?: { name: string; server: string; character: string; item: string };
  /** 뽑기: 완료 처리 여부 (p45) */
  completed?: boolean;
}

export type ListTab = 'all' | 'game' | 'draw';

export type SortOrder = 'recent' | 'oldest' | 'high' | 'low';

// ---------------------------------------------------------------------------
// 대기 중인 후원 (p62~67)

interface PendingBase {
  id: string;
  donorId: string;
  nickname: string;
  account: string;
  cash: number;
  createdAt: number;
  /** 남은 시간 만료 시각(ms). 수락 전: 자동 환불 시간, 수락 후: 미션/제한 시간 */
  deadline: number;
}

export type PendingItem =
  | (PendingBase & { kind: 'quest'; title: string; accepted: boolean })
  | (PendingBase & { kind: 'luckybox'; boxes: number })
  | (PendingBase & {
      kind: 'play';
      challenging: boolean;
      mode: 'choice' | 'initial' | 'drawing';
      question: string;
      choices?: string[];
      hint?: string;
      answerLength?: number;
      limitSeconds: number;
    })
  | (PendingBase & { kind: 'video'; title: string; platform: string; thumbnail: string; url: string });

// ---------------------------------------------------------------------------
// 제어 위젯

export type QuickKind = 'alert' | 'drawing' | 'draw';

export type VolumeKey = 'tts' | 'video' | 'voice' | 'roulette' | 'luckybox' | 'play' | 'draw';

export type UsageKey =
  | 'text'
  | 'mini'
  | 'voice'
  | 'video'
  | 'roulette'
  | 'quest'
  | 'drawing'
  | 'gift'
  | 'luckybox'
  | 'play'
  | 'signature'
  | 'game'
  | 'crew';

export type AlertKey =
  | 'toneAd'
  | 'ytSuperchat'
  | 'ytMembership'
  | 'chzzkCheese'
  | 'chzzkSubscribe'
  | 'twitchBits'
  | 'twitchSubscribe'
  | 'twitchGiftSub'
  | 'twitchGiftSubCount'
  | 'twitchRaid'
  | 'toonation';

export interface DrawBoard {
  id: string;
  name: string;
  /** 상품 소진형 뽑기 여부. 소진형만 잔여 수량을 가진다. */
  consumable: boolean;
  prizes: { name: string; remain: number; total: number }[];
}

export type VoteStatus = 'idle' | 'running' | 'paused' | 'reserved';

export interface VoteForm {
  name: string;
  hours: string;
  minutes: string;
  seconds: string;
  price: string;
  freeTickets: string;
  items: string[];
  reserve: boolean;
  reserveAt: string; // 'YYYY-MM-DDTHH:mm:ss'
}

export interface VoteState {
  status: VoteStatus;
  form?: VoteForm;
  startedAt?: number;
  /** 진행 중일 때 종료 예정 시각 */
  endsAt?: number;
  /** 정지 중일 때 남은 시간(ms) */
  remainingMs?: number;
  reservedAt?: number;
}

export interface CrewMember {
  rank: string;
  name: string;
  score: number;
  contribution: number;
}

export interface CrewState {
  season?: string;
  title?: string;
  members: CrewMember[];
  liveSince?: number;
  result?: { title: string; startedAt: number; endedAt: number; ranking: CrewMember[]; totalCash: number };
}

export interface ToneAd {
  id: string;
  advertiser: string;
  title: string;
  cash: number;
  durationSec: number;
  thumbnail: string;
  playedAt?: number;
  /** 재생 조건 미충족 (예: 송출 중이 아님) */
  playable: boolean;
}

export interface Alarm {
  id: string;
  title: string;
  url: string;
  createdAt: number;
  read: boolean;
}

export interface Notice {
  text: string;
  url?: string;
  background?: string;
  color?: string;
}

export interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'error';
  durationMs: number;
}

export type ShortcutAction =
  | 'alertPause'
  | 'alertSkip'
  | 'drawingPause'
  | 'drawingSkip'
  | 'drawPause'
  | 'drawSkip'
  | 'videoAutoplay'
  | 'videoAudioOnly';

export interface Shortcut {
  id: string;
  action: ShortcutAction | '';
  accelerator: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  textScale: 100 | 125 | 150;
  language: 'ko' | 'en';
  showBlockButton: boolean;
  keepVideoOnBlock: boolean;
  shortcuts: Shortcut[];
  dockPinned: boolean;
  filters: DonationKind[];
  sort: SortOrder;
  columnWidths: Record<string, number>;
}
