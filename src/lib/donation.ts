import type { Donation, DonationKind, ListTab, SortOrder } from '../types';

export const KIND_LABEL: Record<DonationKind, string> = {
  text: '텍스트',
  game: '게임',
  signature: '시그니처',
  mini: '미니',
  voice: '음성',
  video: '영상',
  roulette: '룰렛',
  wishlist: '위시리스트',
  vote: '투표',
  quest: '퀘스트',
  drawing: '그림',
  gift: '기프트',
  luckybox: '럭키박스',
  play: '플레이',
  draw: '뽑기',
  creatorTts: '크리에이터TTS 구독',
  ytSubscribe: '유튜브 구독',
  ytSuperchat: '유튜브 슈퍼쳇',
  ytMembership: '유튜브 멤버십',
  chzzkSubscribe: '치지직 구독',
  chzzkCheese: '치지직 치즈',
  twitchSubscribe: '트위치 구독',
  twitchFollow: '트위치 팔로우',
  twitchBits: '트위치 비트',
  twitchGiftSub: '트위치 구독선물',
  twitchGiftSubCount: '트위치 구독선물 개수',
  twitchRaid: '트위치 레이드',
};

/** 필터 모달 항목 (p42). 왼쪽 열 = 투네이션 후원, 오른쪽 열 = 플랫폼 알림. */
export const FILTER_LEFT: DonationKind[] = [
  'text', 'signature', 'mini', 'voice', 'video', 'roulette', 'wishlist', 'vote', 'quest', 'drawing', 'gift', 'luckybox', 'play',
];
export const FILTER_RIGHT: DonationKind[] = [
  'ytSubscribe', 'ytSuperchat', 'ytMembership', 'chzzkSubscribe', 'chzzkCheese', 'twitchSubscribe', 'twitchFollow',
  'twitchBits', 'twitchGiftSub', 'twitchGiftSubCount', 'twitchRaid', 'creatorTts',
];
export const FILTER_KINDS: DonationKind[] = [...FILTER_LEFT, ...FILTER_RIGHT];

/** '게임'과 '뽑기'는 별도 탭, 나머지는 통합 알림 탭 (p41 ①). */
export function tabOf(kind: DonationKind): ListTab {
  if (kind === 'game') return 'game';
  if (kind === 'draw') return 'draw';
  return 'all';
}

export interface RowActions {
  replay: boolean;
  block: boolean;
  wallpaper: boolean;
}

const ALL: RowActions = { replay: true, block: true, wallpaper: true };
const NO_REPLAY: RowActions = { replay: false, block: true, wallpaper: true };
const NO_REPLAY_NO_WALL: RowActions = { replay: false, block: true, wallpaper: false };
const REPLAY_ONLY: RowActions = { replay: true, block: false, wallpaper: false };
const NONE: RowActions = { replay: false, block: false, wallpaper: false };

/** 행 버튼 노출 정책 (p39 기능 버튼 노출 유무 표). */
export function rowActions(d: Pick<Donation, 'kind' | 'result'>): RowActions {
  switch (d.kind) {
    case 'quest':
    case 'drawing':
      return NO_REPLAY;
    case 'luckybox':
    case 'play':
      return d.result === 'timeout' ? NO_REPLAY_NO_WALL : NO_REPLAY;
    case 'draw':
      return { replay: true, block: false, wallpaper: true };
    case 'creatorTts':
      return NONE;
    case 'ytSubscribe':
    case 'ytSuperchat':
    case 'ytMembership':
    case 'chzzkSubscribe':
    case 'chzzkCheese':
    case 'twitchSubscribe':
    case 'twitchFollow':
    case 'twitchBits':
    case 'twitchGiftSub':
    case 'twitchGiftSubCount':
    case 'twitchRaid':
      return REPLAY_ONLY;
    default:
      return ALL;
  }
}

/** 게임 후원 내용. 수량은 복수 상품일 때만 노출 (p44 ②). */
export function gameContent(d: Donation): string {
  if (!d.game) return d.text ?? '';
  const g = d.game;
  const qty = d.quantity && d.quantity > 1 ? ` ${d.quantity}개` : '';
  return `[${g.name}] [${g.server}] [${g.character}] [${g.item}]${qty}${d.text ? ` ${d.text}` : ''}`;
}

/** 내용 칸 텍스트 노출 형식 (p39). 썸네일은 컴포넌트에서 따로 그린다. */
export function contentText(d: Donation): string {
  const withText = (head: string) => (d.text ? `${head} - ${d.text}` : head);
  switch (d.kind) {
    case 'text':
    case 'mini':
      return d.text ?? '';
    case 'game':
      return gameContent(d);
    case 'signature':
      return withText(d.title ?? '');
    case 'voice':
      return '음성 녹음 후원';
    case 'video':
      return `[${d.platform ?? 'Youtube'}] ${d.title ?? ''}`;
    case 'roulette':
      return `${d.title ?? ''} – ${d.item ?? ''}`;
    case 'wishlist':
      return withText(d.item ?? '');
    case 'vote':
      return `${d.title ?? ''} - ${d.item ?? ''}`;
    case 'quest':
      return `${d.title ?? ''} – ${d.result === 'success' ? '성공' : '실패'}`;
    case 'drawing':
      return `그림 후원 알림 - ${d.title ?? ''}`;
    case 'gift':
      return withText(`${d.item ?? ''} ${d.quantity ?? 1}개`);
    case 'luckybox':
      return d.result === 'timeout' ? '럭키박스 – 시간초과 환불' : d.result === 'win' ? '럭키박스 – 당첨' : '럭키박스 - 꽝';
    case 'play':
      if (d.result === 'timeout') return '플레이 – 시간초과 환불';
      return `${d.title ?? '객관식'} – ${d.result === 'correct' ? '정답' : '오답'}`;
    case 'draw':
      return `${d.title ?? ''} ${d.item ?? ''}`;
    case 'creatorTts':
      return '크리에이터TTS 구독 알림';
    case 'ytSubscribe':
      return '유튜브 구독 알림';
    case 'ytSuperchat':
      return `유튜브 슈퍼챗 알림 - ${d.amountLabel ?? ''}`;
    case 'ytMembership':
      return '유튜브 멤버십 알림';
    case 'chzzkSubscribe':
      return `치지직 구독 알림 - ${d.months ?? 1}개월`;
    case 'chzzkCheese':
      return '치지직 치즈 알림';
    case 'twitchSubscribe':
      return `트위치 구독 알림 - ${d.months ?? 1}개월`;
    case 'twitchFollow':
      return '트위치 팔로우 알림';
    case 'twitchBits':
      return '트위치 비트 알림';
    case 'twitchGiftSub':
      return '트위치 구독선물 알림';
    case 'twitchGiftSubCount':
      return '트위치 구독선물개수 알림';
    case 'twitchRaid':
      return '트위치 레이드 알림';
  }
}

/** 시간 표기 정책 (p40). */
export function relativeTime(at: number, now: number): string {
  const diff = Math.max(0, now - at);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return '방금';
  if (diff < hour) return `${Math.floor(diff / min)}분`;
  if (diff < day) return `${Math.floor(diff / hour)}시간`;
  if (diff < 30 * day) return `${Math.floor(diff / day)}일`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))}개월`;
  return `${Math.floor(diff / (365 * day))}년`;
}

export function sortDonations(list: Donation[], order: SortOrder): Donation[] {
  const copy = [...list];
  switch (order) {
    case 'recent':
      return copy.sort((a, b) => b.createdAt - a.createdAt);
    case 'oldest':
      return copy.sort((a, b) => a.createdAt - b.createdAt);
    case 'high':
      return copy.sort((a, b) => b.cash - a.cash || b.createdAt - a.createdAt);
    case 'low':
      return copy.sort((a, b) => a.cash - b.cash || b.createdAt - a.createdAt);
  }
}

/** 뽑기 탭: 미완료가 위, 완료 처리된 항목은 아래 (p45 2-2). 각 그룹은 최근 순. */
export function sortDraws(list: Donation[]): Donation[] {
  return [...list].sort((a, b) => Number(!!a.completed) - Number(!!b.completed) || b.createdAt - a.createdAt);
}

export const LIST_LIMIT = 100;
export const DRAW_SEARCH_LIMIT = 1000;

export const formatCash = (n: number) => n.toLocaleString('ko-KR');
