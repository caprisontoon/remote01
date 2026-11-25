// 후원 종류 색 (docs/design/toona-design-tokens.md §1-5).
// 화면에서 hex를 직접 쓰는 곳은 이 파일 하나뿐이다. 앱 시작 때 CSS 변수(--kind-*)로 등록하고,
// 화면에서는 kindColor(kind)로 var(...)만 참조한다 → 다크/라이트 전환은 다른 토큰과 똑같이 변수 값만 바뀐다.
import type { DonationKind } from '../types';

type KindGroup = 'text' | 'voice' | 'video' | 'chzzk' | 'mini' | 'twitch' | 'roulette' | 'youtube' | 'wish' | 'luckybox' | 'etc';

const KIND_COLORS: Record<KindGroup, { dark: string; light: string }> = {
  // 값은 토큰 문서 v1.1 §1-5와 같다 (라이트 일부는 11px 태그 글자가 바탕 대비 4.5:1 이상이 되도록 진하게 조정된 값)
  text: { dark: '#4CC3FF', light: '#0079B8' },
  voice: { dark: '#3DD68C', light: '#027A48' },
  video: { dark: '#C77DFF', light: '#9E3BEA' },
  chzzk: { dark: '#22C55E', light: '#15803D' },
  mini: { dark: '#FFB547', light: '#B54708' }, // 미니 / 퀘스트
  twitch: { dark: '#9B8AFB', light: '#6E56CF' },
  roulette: { dark: '#FF5FA2', light: '#C11574' }, // [v1.1] 유튜브 빨강과 구분되도록 분홍 계열
  youtube: { dark: '#F04438', light: '#B42318' },
  wish: { dark: '#D6A77A', light: '#93622F' }, // 위시리스트·기프트
  luckybox: { dark: '#4CC3FF', light: '#0079B8' },
  etc: { dark: '#A3A9B4', light: '#667085' }, // 이미지·그림·기타
};

const GROUP: Record<DonationKind, KindGroup> = {
  text: 'text',
  creatorTts: 'text',
  voice: 'voice',
  video: 'video',
  mini: 'mini',
  quest: 'mini',
  roulette: 'roulette',
  wishlist: 'wish',
  gift: 'wish',
  luckybox: 'luckybox',
  chzzkSubscribe: 'chzzk',
  chzzkCheese: 'chzzk',
  ytSubscribe: 'youtube',
  ytSuperchat: 'youtube',
  ytMembership: 'youtube',
  twitchSubscribe: 'twitch',
  twitchFollow: 'twitch',
  twitchBits: 'twitch',
  twitchGiftSub: 'twitch',
  twitchGiftSubCount: 'twitch',
  twitchRaid: 'twitch',
  game: 'etc',
  signature: 'etc',
  vote: 'etc',
  drawing: 'etc',
  play: 'etc',
  draw: 'etc',
};

/** 종류 색을 참조하는 CSS 값 (예: style={{ color: kindColor('voice') }}) */
export const kindColor = (kind: DonationKind) => `var(--kind-${GROUP[kind]})`;

/** 종류 색 변수를 문서에 한 번 등록한다 (main.tsx). */
export function installKindColors() {
  const vars = (mode: 'dark' | 'light') =>
    (Object.keys(KIND_COLORS) as KindGroup[]).map((g) => `--kind-${g}: ${KIND_COLORS[g][mode]};`).join(' ');
  const style = document.createElement('style');
  style.dataset.tokens = 'donation-kinds';
  style.textContent = `:root { ${vars('light')} } .dark { ${vars('dark')} }`;
  document.head.appendChild(style);
}
