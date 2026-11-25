// 리모컨 채팅 위젯 (모니터링) 엔진.
// 원본: caprisontoon/total public/chat-widget-app.html (채팅 위젯 프로토타입).
// 채팅 한 줄은 원본과 같은 HTML(.cw-* 클래스)로 그려서 크리에이터가 설정한 채팅창과 같은 모습이 나온다.
// 크리에이터 채팅 위젯 설정 연동 전이라 설정은 원본 기본값(DEFAULTS)으로 고정한다.
import { BADGE_IMG } from './badgeImages';

// ------------------------------------------------------------------ 공통

const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const fmtN = (n: number) => Number(n).toLocaleString('ko-KR');
const rnd = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
const chance = (p: number) => Math.random() < p;

// ------------------------------------------------------------------ 플랫폼 · 배지

type UserClass = 'streamer' | 'manager' | 'tn' | 'vip' | 'subscriber' | 'general';

interface Role {
  k: string;
  label: string;
  cls: UserClass | null;
  g: string;
  bg: string;
  fg: string;
  months?: boolean;
  off?: boolean;
  img?: string;
}

interface Platform {
  name: string;
  icon: string;
  bg: string;
  fg: string;
  userColor: boolean;
  viewers: number;
  roles: Role[];
}

export const PF: Record<string, Platform> = {
  youtube: {
    name: 'YouTube', icon: '▶', bg: '#ff0033', fg: '#fff', userColor: false, viewers: 1240,
    roles: [
      { k: 'owner', label: '스트리머', cls: 'streamer', g: '♛', bg: '#ffd23f', fg: '#3a2a00' },
      { k: 'moderator', label: '모더레이터', cls: 'manager', g: 'M', bg: '#5e84f1', fg: '#fff' },
      { k: 'member', label: '멤버십', cls: 'vip', g: '멤', bg: '#0f9d58', fg: '#fff' },
      { k: 'verified', label: '인증', cls: null, g: '✓', bg: '#8a8f98', fg: '#fff' },
    ],
  },
  twitch: {
    name: 'Twitch', icon: 'T', bg: '#9146ff', fg: '#fff', userColor: true, viewers: 860,
    roles: [
      { k: 'broadcaster', label: '스트리머', cls: 'streamer', g: '♛', bg: '#e91916', fg: '#fff' },
      { k: 'moderator', label: '모더레이터', cls: 'manager', g: 'M', bg: '#00ad03', fg: '#fff' },
      { k: 'vip', label: 'VIP', cls: 'vip', g: 'VIP', bg: '#e005b9', fg: '#fff' },
      { k: 'subscriber', label: '구독', cls: 'subscriber', g: '구', bg: '#9146ff', fg: '#fff', months: true },
      { k: 'founder', label: '창립자', cls: null, g: 'F', bg: '#ffb800', fg: '#2a1d00' },
      { k: 'subgifter', label: '구독 선물', cls: null, g: '선', bg: '#ff5bb0', fg: '#fff' },
      { k: 'verified', label: '인증', cls: null, g: '✓', bg: '#a970ff', fg: '#fff' },
      { k: 'artist', label: '아티스트', cls: null, g: 'A', bg: '#1e69ff', fg: '#fff' },
      { k: 'bits', label: 'Bits', cls: null, g: '◆', bg: '#9c3ee8', fg: '#fff' },
      { k: 'turbo', label: '터보', cls: null, g: 'T', bg: '#59399a', fg: '#fff', off: true },
      { k: 'prime', label: 'Prime Gaming', cls: null, g: 'P', bg: '#0aa4e5', fg: '#fff', off: true },
    ],
  },
  chzzk: {
    name: '치지직', icon: 'Z', bg: '#00e396', fg: '#0b1a12', userColor: true, viewers: 2310,
    roles: [
      { k: 'streamer', label: '스트리머', cls: 'streamer', g: '♛', bg: '#00e396', fg: '#0b1a12' },
      { k: 'channelmgr', label: '채널 관리자', cls: 'manager', g: 'M', bg: '#2e6bff', fg: '#fff' },
      { k: 'chatmgr', label: '채팅 운영자', cls: 'manager', g: '운', bg: '#5a8cff', fg: '#fff' },
      { k: 'verified', label: '인증 마크', cls: null, g: '✓', bg: '#1f2a22', fg: '#00e396' },
      { k: 'subscriber', label: '구독', cls: 'subscriber', g: '구', bg: '#9b5cff', fg: '#fff' },
      { k: 'etc', label: '기타 배지 (이미지 그대로)', cls: null, g: '★', bg: '#ffcc33', fg: '#3a2a00' },
    ],
  },
  kick: {
    name: 'KICK', icon: 'K', bg: '#53fc18', fg: '#0b0e0f', userColor: true, viewers: 140,
    roles: [
      { k: 'broadcaster', label: '스트리머', cls: 'streamer', g: '♛', bg: '#53fc18', fg: '#0b0e0f' },
      { k: 'moderator', label: '모더레이터', cls: 'manager', g: 'M', bg: '#00c7ff', fg: '#04202b' },
      { k: 'vip', label: 'VIP', cls: 'vip', g: 'VIP', bg: '#ffc800', fg: '#2a2000' },
      { k: 'subscriber', label: '구독', cls: 'subscriber', g: '구', bg: '#2fbf71', fg: '#fff', months: true },
      { k: 'og', label: 'OG', cls: null, g: 'OG', bg: '#00d2a0', fg: '#04241c' },
      { k: 'founder', label: '창립자', cls: null, g: 'F', bg: '#ffb800', fg: '#2a1d00' },
      { k: 'verified', label: '인증', cls: null, g: '✓', bg: '#1f2a22', fg: '#53fc18' },
      { k: 'subgifter', label: '구독 선물', cls: null, g: '선', bg: '#ff5bb0', fg: '#fff' },
      { k: 'kicks', label: 'KICKs', cls: null, g: 'Ks', bg: '#0b0e0f', fg: '#53fc18', off: true },
    ],
  },
  chear: {
    name: 'CHEAR', icon: 'C', bg: '#ff4f7b', fg: '#fff', userColor: false, viewers: 95,
    roles: [
      { k: 'streamer', label: '스트리머', cls: 'streamer', g: '♛', bg: '#ff4f7b', fg: '#fff' },
      { k: 'manager', label: '매니저', cls: 'manager', g: 'M', bg: '#4f8cff', fg: '#fff' },
      { k: 'fan', label: '팬', cls: 'subscriber', g: '팬', bg: '#ff9f43', fg: '#2a1600', months: true },
    ],
  },
};
export const PF_ORDER = ['youtube', 'chear', 'kick', 'chzzk', 'twitch'];
PF_ORDER.forEach((p) => PF[p].roles.forEach((r) => {
  const u = (BADGE_IMG[p] || {})[r.k];
  if (u) r.img = u;
}));
const TOON: Platform = { name: '투네이션', icon: '+', bg: '#2f6bff', fg: '#fff', userColor: false, viewers: 0, roles: [] };
const pf = (k: string) => (k === 'toonation' ? TOON : PF[k]);

type Tier = 'VIP' | 'VVIP' | 'SVIP';
const TIERS: Record<Tier, { g: string; bg: string; fg: string }> = {
  VIP: { g: 'VIP', bg: '#2f6bff', fg: '#fff' },
  VVIP: { g: 'VVIP', bg: '#8b5cf6', fg: '#fff' },
  SVIP: { g: 'SVIP', bg: 'linear-gradient(135deg,#ffe08a,#ff9f1c)', fg: '#3a2400' },
};
const EMOTES: Record<string, string> = { heart: '❤️', clap: '👏', lol: '🤣', fire: '🔥', cry: '😭', gg: '🏆' };
const BOT_NAMES = ['nightbot', 'streamelements', 'moobot', 'fossabot', 'wizebot', 'botrix'];

// ------------------------------------------------------------------ 투네이션 후원 종류

type Detail = Record<string, string | number>;
interface TnKind {
  k: string;
  label: string;
  grp: 'msg' | 'media' | 'select' | 'mission';
  w: number;
  msg: boolean;
  amt: string;
  unit?: '원';
  amounts: number[];
  line: (d: Detail) => string;
  sample: () => Detail;
}

// 채팅창 후원 표시 색: 후원 종류와 상관없이 한 가지 색
const TN_COLOR = '#2f6bff';
const TN_COLOR2 = '#5a3fe0';
const TN_KINDS: TnKind[] = [
  { k: 'text', label: '텍스트', grp: 'msg', w: 30, msg: true, amt: '후원 금액', amounts: [1000, 3000, 5000, 10000, 30000], line: () => '', sample: () => ({}) },
  { k: 'mini', label: '미니', grp: 'msg', w: 10, msg: true, amt: '후원 금액', amounts: [1000, 2000], line: () => '',
    sample: () => ({ colorOn: chance(0.4) ? '적용' : '적용 안 함', color: rnd(['#ffd166', '#7bdff2', '#ff8fab', '#b8f2a0']) }) },
  { k: 'voice', label: '음성', grp: 'media', w: 6, msg: false, amt: '후원 금액', amounts: [1000, 2000, 3000],
    line: (d) => `음성 ${d.seconds}초`, sample: () => ({ seconds: 5 + Math.floor(Math.random() * 25) }) },
  { k: 'video', label: '영상', grp: 'media', w: 8, msg: false, amt: '후원 금액', amounts: [3000, 5000, 6000],
    line: (d) => `「${d.title}」 ${d.seconds}초`, sample: () => ({ title: rnd(['오늘의 하이라이트 클립', '추천 플레이 영상', '응원 영상']), seconds: 10 + Math.floor(Math.random() * 50) }) },
  { k: 'drawing', label: '그림', grp: 'media', w: 2, msg: false, amt: '후원 금액', amounts: [2000, 5000],
    line: (d) => `「${d.title}」`, sample: () => ({ title: rnd(['내 그림 어때?', '방장 초상화', '오늘의 낙서']) }) },
  { k: 'signature', label: '시그니처', grp: 'select', w: 8, msg: true, amt: '후원 금액', amounts: [5000, 10000, 30000],
    line: (d) => `「${d.signature}」`, sample: () => ({ signature: rnd(['하트 뿅뿅', '치킨 먹자', '박수 갈채']) }) },
  { k: 'roulette', label: '룰렛', grp: 'select', w: 8, msg: false, amt: '룰렛 금액', amounts: [1000, 5000],
    line: (d) => `「${d.roulette}」`, sample: () => ({ roulette: rnd(['작은 용돈 플러스', '큰 용돈 플러스', '벌칙 룰렛']) }) },
  { k: 'gacha', label: '뽑기', grp: 'select', w: 3, msg: false, amt: '총 금액', amounts: [3000, 30000],
    line: (d) => `「${d.gacha}」 ${d.count}`, sample: () => ({ gacha: rnd(['행운 캡슐', '스페셜 박스']), count: rnd(['1회', '1회', '10회']) }) },
  { k: 'vote', label: '투표', grp: 'select', w: 3, msg: false, amt: '총 금액', amounts: [20000, 40000],
    line: (d) => `「${d.question}」 ${d.option}에 ${d.votes}표`,
    sample: () => ({ question: '다음 게임 뭐 할까?', option: rnd(['공포 게임', '리듬 게임', '레이싱']), votes: 1 + Math.floor(Math.random() * 5), ticket: chance(0.2) ? '무료' : '유료' }) },
  { k: 'wishlist', label: '위시리스트', grp: 'select', w: 3, msg: true, amt: '상품 가격', amounts: [3000, 30000, 50000],
    line: (d) => `「${d.item}」`, sample: () => ({ item: rnd(['기계식 키보드', '방송용 마이크', '의자 쿠션']) }) },
  { k: 'gift', label: '기프트', grp: 'select', w: 3, msg: true, amt: '후원 금액', amounts: [1000, 5000],
    line: (d) => `「${d.item}」 선물`, sample: () => ({ item: rnd(['커피 기프티콘', '케이크 교환권', '모니터 피규어']) }) },
  { k: 'game', label: '게임', grp: 'select', w: 3, msg: true, amt: '결제 금액', unit: '원', amounts: [3300, 13200],
    line: (d) => `${d.game} · 「${d.item}」 ×${d.qty}`,
    sample: () => ({ game: '판타지 온라인', character: '전사01', item: rnd(['다이아', '부활권', '보급 상자']), qty: 1 + Math.floor(Math.random() * 5) }) },
  { k: 'crew', label: '크루', grp: 'select', w: 2, msg: true, amt: '후원 금액', amounts: [10000, 30000],
    line: (d) => `${d.member} · ${d.crewType === '시그니처' ? `「${d.signature}」` : d.crewType} · 기여도 ${d.contrib === '마이너스' ? '−' : '+'}`,
    sample: () => ({ member: rnd(['크루원A', '크루원B']), crewType: rnd(['시그니처', '텍스트', 'UP']), signature: '하트 뿅뿅', contrib: chance(0.15) ? '마이너스' : '플러스' }) },
  { k: 'quest', label: '퀘스트', grp: 'mission', w: 3, msg: false, amt: '성공 상금', amounts: [10000, 30000],
    line: (d) => `「${d.quest}」 · 제한 ${d.minutes}분`, sample: () => ({ quest: rnd(['페트병 던져서 한번에 세우기', '노데스 클리어', '10킬 달성']), minutes: rnd([10, 30, 60]) }) },
  { k: 'luckybox', label: '럭키박스', grp: 'mission', w: 3, msg: false, amt: '당첨 상금', amounts: [5000, 10000],
    line: (d) => `박스 ${d.boxes}개 중 당첨 ${d.wins}개 · 꽝 위로금 ${fmtN(Number(d.consolation))}캐시`, sample: () => ({ boxes: rnd(['2', '3', '4']), wins: 1, consolation: 1000 }) },
  { k: 'play', label: '플레이', grp: 'mission', w: 3, msg: false, amt: '정답 상금', amounts: [5000, 10000],
    line: (d) => `${d.mode} 「${d.question}」`, sample: () => ({ mode: rnd(['객관식 퀴즈', '초성 퀴즈', '그림 퀴즈']), question: rnd(['영화 속 명대사 맞히기', '오늘 점심 메뉴는?']) }) },
];
const TN_KIND: Record<string, TnKind> = Object.fromEntries(TN_KINDS.map((x) => [x.k, x]));
function pickTnKind() {
  let r = Math.random() * TN_KINDS.reduce((a, x) => a + x.w, 0);
  for (const x of TN_KINDS) {
    r -= x.w;
    if (r <= 0) return x.k;
  }
  return 'text';
}

const NICK_DARK: Record<UserClass, string> = { streamer: '#ffd23f', manager: '#5ec8ff', tn: '#b98cff', vip: '#ff7ad9', subscriber: '#8ef0a8', general: '#e6e9ef' };
const MSG_DARK: Record<UserClass, string> = { streamer: '#ffffff', manager: '#ffffff', tn: '#ffffff', vip: '#ffffff', subscriber: '#ffffff', general: '#ffffff' };

// ------------------------------------------------------------------ 설정 (원본 기본값 고정)

const roleOnDefault: Record<string, Record<string, boolean>> = {};
PF_ORDER.forEach((k) => {
  roleOnDefault[k] = {};
  PF[k].roles.forEach((r) => (roleOnDefault[k][r.k] = !r.off));
});

/** 크리에이터 채팅 위젯 설정. 연동 전이라 원본 DEFAULTS 값 그대로 (기본 박스 테마, 제주고딕 20px, 외곽선 3px) */
export const CHAT_SETTINGS = {
  theme: 'basic',
  box: { mode: 'box', color: '#000000', alpha: 45, radius: 8 },
  layout: { align: 'wrap', dir: 'left', gap: 6, colon: false },
  fx: { type: 'slide', out: 'fade' },
  badges: { platform: true, roles: true, months: true, tn: true, tnPos: 'before' as 'before' | 'after', size: 'm', roleOn: roleOnDefault },
  colors: { nickMode: 'role', nickBg: 'off', single: '#ffffff', tnPriority: true, nick: { ...NICK_DARK }, msg: { ...MSG_DARK } },
  font: { family: 'Jeju Gothic', size: 20, bold: true, outline: true, outlineColor: '#000000', outlineWidth: 3 },
  filter: { platforms: Object.fromEntries(PF_ORDER.map((k) => [k, true])) as Record<string, boolean>, nicks: [] as string[], bots: true, words: ['바보', '광고문의'], wordMode: 'heart' as 'heart' | 'hide' },
  tn: { on: true, style: 'strong', autoMin: 10000, tierCard: true, tierOn: { VIP: true, VVIP: true, SVIP: true } as Record<Tier, boolean>, showAmount: true, showMessage: true, kinds: Object.fromEntries(TN_KINDS.map((x) => [x.k, true])) as Record<string, boolean> },
};
const S = CHAT_SETTINGS;

// ------------------------------------------------------------------ 메시지

export interface ChatUser {
  id: string;
  nickname: string;
  color: string | null;
  roles: string[];
  subMonths: number | null;
  toonationTier: Tier | null;
  isBot: boolean;
}

type Fragment = { type: 'text'; text: string } | { type: 'emote'; name: string };

export interface ChatMsg {
  id: string;
  platform: string;
  type: 'chat' | 'toonation_donation';
  user: ChatUser;
  message: { text: string; fragments: Fragment[] };
  donation?: { kind: string; kindLabel: string; amount: { value: number }; free: boolean; detail: Detail; summary: string };
  /** 받은 시각 (ms) */
  t: number;
}

let seq = 0;
function fragments(text: string): Fragment[] {
  return text
    .split(/(:[a-z]+:)/)
    .filter(Boolean)
    .map((t) => {
      const m = t.match(/^:([a-z]+):$/);
      return m && EMOTES[m[1]] ? { type: 'emote' as const, name: m[1] } : { type: 'text' as const, text: t };
    });
}
function mk(p: string, u: ChatUser, type: ChatMsg['type'], text: string): ChatMsg {
  return {
    id: 'msg_' + String(++seq).padStart(5, '0'),
    platform: p,
    type,
    user: { ...u, roles: [...u.roles] },
    message: { text, fragments: fragments(text) },
    t: Date.now(),
  };
}
function mkTn(u: ChatUser, kind: string, amount: number, text: string, detail: Detail = {}): ChatMsg {
  const K = TN_KIND[kind];
  const hasMsg = K.msg && !(kind === 'crew' && detail.crewType === 'UP'); // 크루 UP 후원은 메시지 입력 없음
  const free = kind === 'vote' && detail.ticket === '무료';
  const m = mk('toonation', { ...u, roles: [], color: null }, 'toonation_donation', hasMsg ? text : '');
  m.donation = { kind, kindLabel: K.label, amount: { value: free ? 0 : amount }, free, detail, summary: K.line(detail) };
  return m;
}

// ------------------------------------------------------------------ 목업 채팅 생성기 (실서버 연동 전)

const NICKS = ['성덕선', '히나마루', '고양이집사', '새벽세시', '치즈냥', '감자튀김', '무지개곰', '퇴근하고왔음', 'StarDust_kr', 'neo_kim', '밤샘러', '수박바', '오늘도출석', '라면한그릇', 'pixelfox', '단풍잎', '공부하다옴', '떨어진다꽉잡아'];
const COLORS = ['#ff6b6b', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff', '#ff8fab', '#90be6d', '#f9844a', '#7bdff2'];
const CHAT_LINES = ['ㅋㅋㅋㅋㅋㅋ', '오늘 컨디션 좋아 보이네요', '방금 그거 진짜 미쳤다 :fire:', '하이하이~ 출석!', '다음 판 가자!!', '이거 몇 시까지 해요?', 'ㄹㅇ 개웃기네 :lol:', '첫 방송부터 봤어요 :clap:', '아 아깝다 ㅠㅠ :cry:', 'GG :gg:', '오늘 합방 언제 해요?', '브금 제목 뭐예요?', '퇴근하고 바로 왔어요', '방금 클립 땄다 ㅋㅋ', ':heart: :heart: :heart:', '물 좀 드세요!', '이 게임 엔딩 몇 개예요?', '바보같이 또 죽었네 ㅋㅋ', 'nice shot', 'lol that was clean', '채팅창 디자인 바뀌었네?', '광고문의는 DM 주세요', '보스 패턴 외웠다 이제'];
const STREAMER_LINES = ['다들 와줘서 고마워요!', '잠깐 물 마시고 올게요', '다음 판 진짜 이긴다', '구독 고마워요 :heart:'];
const MANAGER_LINES = ['도배 자제 부탁드려요', '다음 합방 일정은 공지 확인해 주세요', '클립 채널에 올려뒀어요'];
const BOT_LINES = ['명령어 목록은 !명령어 로 확인하세요', '팔로우 고마워요! 즐거운 시청 되세요'];
const DON_LINES = ['오늘 방송 너무 재밌어요!', '치킨 드세요 :heart:', '다음 게임은 공포겜 가즈아', '생일 축하해요!!', '응원합니다 :clap:'];

const uidOf = (p: string) => p + '_' + Math.random().toString(16).slice(2, 10);
const roleOf = (p: string, cls: UserClass) => PF[p].roles.find((r) => r.cls === cls);
function makeUser(p: string, nickname: string, roles: string[] = [], extra: Partial<ChatUser> = {}): ChatUser {
  return { id: uidOf(p), nickname, roles, color: PF[p].userColor ? rnd(COLORS) : null, subMonths: null, toonationTier: null, isBot: false, ...extra };
}

interface Pool {
  streamer: ChatUser;
  managers: ChatUser[];
  viewers: ChatUser[];
  bot: ChatUser | null;
}

/** 플랫폼별 시청자·매니저·봇을 만들고, 호출할 때마다 채팅 하나를 돌려준다 (원본 mockMessage) */
export function createChatMock() {
  const pools: Record<string, Pool> = {};
  PF_ORDER.forEach((p) => {
    const P = PF[p];
    const streamer = makeUser(p, '커피라이터', [roleOf(p, 'streamer')!.k]);
    const shuffled = [...NICKS].sort(() => Math.random() - 0.5);
    const managers = [makeUser(p, shuffled.pop()!, [roleOf(p, 'manager')!.k])];
    const viewers = shuffled.slice(0, 10).map((n) => {
      const roles: string[] = [];
      let months: number | null = null;
      const sub = roleOf(p, 'subscriber');
      const vip = roleOf(p, 'vip');
      if (sub && chance(0.5)) {
        roles.push(sub.k);
        months = 1 + Math.floor(Math.random() * 36);
      }
      if (vip && chance(0.18)) {
        roles.push(vip.k);
        if (vip.months) months = months || 1 + Math.floor(Math.random() * 24);
      }
      P.roles.filter((r) => !r.cls).forEach((r) => {
        if (chance(0.16)) roles.push(r.k);
      });
      const t = Math.random();
      const tier: Tier | null = t < 0.12 ? 'VIP' : t < 0.19 ? 'VVIP' : t < 0.22 ? 'SVIP' : null;
      return makeUser(p, n, roles, { subMonths: months, toonationTier: tier });
    });
    const bot = p === 'twitch' || p === 'youtube' ? makeUser(p, p === 'twitch' ? 'Nightbot' : 'StreamElements', ['moderator'], { isBot: true }) : null;
    pools[p] = { streamer, managers, viewers, bot };
  });
  // 시청자가 많은 플랫폼에서 채팅이 더 많이 온다
  const pickPlatform = () => {
    const tot = PF_ORDER.reduce((a, k) => a + Math.sqrt(PF[k].viewers), 0);
    let r = Math.random() * tot;
    for (const k of PF_ORDER) {
      r -= Math.sqrt(PF[k].viewers);
      if (r <= 0) return k;
    }
    return PF_ORDER[0];
  };
  return function next(): ChatMsg {
    const p = pickPlatform();
    const pool = pools[p];
    const r = Math.random();
    const viewer = rnd(pool.viewers);
    if (r < 0.05) return mk(p, pool.streamer, 'chat', rnd(STREAMER_LINES));
    if (r < 0.08 && pool.bot) return mk(p, pool.bot, 'chat', rnd(BOT_LINES));
    if (r < 0.15) {
      const k = pickTnKind();
      const K = TN_KIND[k];
      return mkTn({ ...viewer, id: 'tn_' + viewer.id }, k, rnd(K.amounts), rnd(DON_LINES), K.sample());
    }
    if (r < 0.19) return mk(p, rnd(pool.managers), 'chat', rnd(MANAGER_LINES));
    return mk(p, viewer, 'chat', rnd(CHAT_LINES));
  };
}

/** 목업 채팅 속도 (원본 기본값 초당 1.2개, 간격은 들쭉날쭉) */
export const nextChatDelay = () => (1000 / 1.2) * (0.35 + Math.random() * 1.3);

// ------------------------------------------------------------------ 표시 여부 (채팅 필터)

export function filteredReason(m: ChatMsg): string | null {
  if (PF[m.platform] && S.filter.platforms[m.platform] === false) return 'platform';
  const nick = m.user.nickname.toLowerCase();
  if (S.filter.nicks.some((n) => n.toLowerCase() === nick)) return 'nick';
  if (S.filter.bots && (m.user.isBot || BOT_NAMES.includes(nick))) return 'bot';
  if (S.filter.wordMode === 'hide' && S.filter.words.some((w) => w && m.message.text.includes(w))) return 'word';
  return null;
}

export function visible(m: ChatMsg) {
  if (filteredReason(m)) return false;
  if (m.type === 'toonation_donation' && m.donation) {
    if (!S.tn.on || !S.tn.kinds[m.donation.kind]) return false;
  }
  return true;
}

// ------------------------------------------------------------------ 그리기 (원본과 같은 HTML)

function userClass(m: ChatMsg): UserClass {
  const P = pf(m.platform);
  const clsSet = new Set(m.user.roles.map((k) => (P.roles.find((r) => r.k === k) || ({} as Role)).cls).filter(Boolean));
  if (clsSet.has('streamer')) return 'streamer';
  if (clsSet.has('manager')) return 'manager';
  const tn = m.user.toonationTier && S.badges.tn;
  if (tn && S.colors.tnPriority) return 'tn';
  if (clsSet.has('vip')) return 'vip';
  if (clsSet.has('subscriber')) return 'subscriber';
  if (tn) return 'tn';
  return 'general';
}
function hashColor(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 78% 68%)`;
}
function nickColor(m: ChatMsg) {
  const c = S.colors;
  const cls = userClass(m);
  if (c.nickMode === 'single') return c.single;
  if (c.nickMode === 'random') return hashColor(m.user.nickname);
  if (c.nickMode === 'platform') return m.user.color || c.nick[cls];
  return c.nick[cls];
}
const tierBadge = (t: Tier) => {
  const T = TIERS[t];
  return `<span class="cw-badge cw-tnb" style="background:${T.bg};color:${T.fg}" title="투네이션 ${t}">${T.g}</span>`;
};
function badges(m: ChatMsg) {
  const P = pf(m.platform);
  const pre: string[] = [];
  if (S.badges.platform) pre.push(`<span class="cw-pf" style="background:${P.bg};color:${P.fg}" title="${P.name}">${P.icon}</span>`);
  const tn = S.badges.tn && m.user.toonationTier ? tierBadge(m.user.toonationTier) : '';
  if (tn && S.badges.tnPos === 'before') pre.push(tn);
  if (S.badges.roles)
    P.roles.forEach((r) => {
      if (!m.user.roles.includes(r.k) || !(S.badges.roleOn[m.platform] || {})[r.k]) return;
      const mo = r.months && S.badges.months && m.user.subMonths ? `<i>${m.user.subMonths}</i>` : '';
      pre.push(
        r.img
          ? `<span class="cw-badge cw-bimg" title="${P.name} ${r.label}"><img src="${r.img}" alt="${r.label}">${mo}</span>`
          : `<span class="cw-badge" style="background:${r.bg};color:${r.fg}" title="${P.name} ${r.label}">${r.g}${mo}</span>`,
      );
    });
  return { pre: pre.join(''), post: tn && S.badges.tnPos === 'after' ? ' ' + tn : '' };
}
function textHtml(m: ChatMsg) {
  const filterOn = S.filter.wordMode === 'heart';
  return m.message.fragments
    .map((f) => {
      if (f.type === 'emote') return `<span class="cw-emote" title=":${f.name}:">${EMOTES[f.name]}</span>`;
      let t = f.text;
      if (filterOn) S.filter.words.forEach((w) => {
        if (w) t = t.split(w).join('♡'.repeat([...w].length));
      });
      return esc(t);
    })
    .join('');
}
function hhmm(t: number) {
  const d = new Date(t || Date.now());
  const h = d.getHours();
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
}
const avaHtml = (m: ChatMsg) => `<span class="cw-ava" aria-hidden="true">${esc([...m.user.nickname][0] || '?')}</span>`;
const timeHtml = (m: ChatMsg) => `<span class="cw-time">${hhmm(m.t)}</span>`;
const altCls = (m: ChatMsg) => (parseInt(m.id.replace(/\D/g, ''), 10) % 2 ? 'alt' : '');
function tnAmountText(d: NonNullable<ChatMsg['donation']>) {
  const K = TN_KIND[d.kind];
  if (d.free) return '무료';
  return (K.grp === 'mission' ? '상금 ' : '') + fmtN(d.amount.value) + (K.unit === '원' ? '원' : '캐시');
}
function tnCardVariant(d: NonNullable<ChatMsg['donation']>) {
  if (S.tn.style !== 'auto') return S.tn.style;
  return (d.free ? 0 : d.amount.value) >= S.tn.autoMin ? 'strong' : 'simple';
}
function tnHtml(m: ChatMsg) {
  const d = m.donation!;
  const cls = userClass(m);
  const b = badges(m);
  const tier = m.user.toonationTier;
  const premium = S.tn.tierCard && tier && S.tn.tierOn[tier];
  const v = premium ? `premium tnt-${tier!.toLowerCase()}` : tnCardVariant(d);
  const chip = `<span class="cw-ev cw-tnchip" style="background:${TN_COLOR}">${d.kindLabel}${S.tn.showAmount ? ' ' + tnAmountText(d) : ''}</span>`;
  const det = d.summary ? `<span class="cw-det">${esc(d.summary)}</span>` : '';
  const mcol = d.kind === 'mini' && d.detail.colorOn === '적용' ? ` style="color:${esc(d.detail.color)}"` : '';
  const msg = S.tn.showMessage && m.message.text ? (det ? '<span class="cw-det cw-sepdot">·</span>' : '') + `<span class="cw-msgline"${mcol}>${textHtml(m)}</span>` : '';
  return (
    `<div class="cw-msg cw-tn tn-card tnc-${v} r-${cls} ${altCls(m)}" data-id="${m.id}" data-t="${m.t}" style="--pc:#2f6bff;--gc:${TN_COLOR};--gc2:${TN_COLOR2};--nc:${nickColor(m)};--mc:#fff">` +
    avaHtml(m) +
    `<span class="cw-head">${b.pre}<span class="cw-nick">${esc(m.user.nickname)}</span>${b.post}${timeHtml(m)}</span>` +
    `<span class="cw-text">${chip}${det}${msg}</span></div>`
  );
}
function lumOf(c: string) {
  let r: number, g: number, b: number;
  c = String(c).trim();
  const h = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (h) {
    const x = h[1].length === 3 ? h[1].split('').map((v) => v + v).join('') : h[1];
    const n = parseInt(x, 16);
    r = (n >> 16) & 255;
    g = (n >> 8) & 255;
    b = n & 255;
  } else {
    const m = c.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
    if (!m) return 1;
    const H = +m[1] / 360;
    const S2 = +m[2] / 100;
    const L = +m[3] / 100;
    const q = L < 0.5 ? L * (1 + S2) : L + S2 - L * S2;
    const p2 = 2 * L - q;
    const f = (t: number) => {
      t = (t + 1) % 1;
      return 255 * (t < 1 / 6 ? p2 + (q - p2) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p2 + (q - p2) * (2 / 3 - t) * 6 : p2);
    };
    r = f(H + 1 / 3);
    g = f(H);
    b = f(H - 1 / 3);
  }
  const L2 = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * L2(r) + 0.7152 * L2(g) + 0.0722 * L2(b);
}
const nickBgOn = (m: ChatMsg) => S.colors.nickBg === 'always' || (S.colors.nickBg === 'dark' && lumOf(nickColor(m)) < 0.18);

/** 채팅 한 줄 HTML (원본 msgHtml). 닉네임·메시지는 esc()로 이스케이프한다 */
export function msgHtml(m: ChatMsg) {
  if (m.type === 'toonation_donation') return tnHtml(m);
  const P = pf(m.platform);
  const cls = userClass(m);
  const b = badges(m);
  return (
    `<div class="cw-msg r-${cls} ${altCls(m)}" data-id="${m.id}" data-t="${m.t}" style="--pc:${P.bg};--nc:${nickColor(m)};--mc:${S.colors.msg[cls]}">` +
    avaHtml(m) +
    `<span class="cw-head">${b.pre}<span class="cw-nick${nickBgOn(m) ? ' nbg' : ''}">${esc(m.user.nickname)}</span>${b.post}${timeHtml(m)}</span>` +
    `<span class="cw-text">${textHtml(m)}</span></div>`
  );
}

// ------------------------------------------------------------------ 채팅 영역 스타일 (원본 applyScope + syncRemoteScope)

const hexToRgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/**
 * 채팅 영역 클래스·CSS 변수. 모니터링용이라 '위쪽 흐리게'(fade-top)는 넣지 않고,
 * 리모컨 텍스트 크기(pct %)를 폰트 크기에 곱한다.
 */
export function scopeOf(pct: number): { className: string; style: Record<string, string> } {
  const className = ['cw-scope', 'th-' + S.theme, 'box-' + S.box.mode, 'al-' + S.layout.align, 'dir-' + S.layout.dir, 'fx-' + S.fx.type, 'fxo-' + S.fx.out, 'bs-' + S.badges.size, S.font.outline ? 'outlined' : '', S.layout.colon ? 'colon' : '']
    .filter(Boolean)
    .join(' ');
  return {
    className,
    style: {
      '--ff': `'${S.font.family}', 'Noto Sans KR', sans-serif`,
      '--fs': (S.font.size * pct) / 100 + 'px',
      '--wfs': Math.round((S.font.size * 0.8 * pct) / 100) + 'px',
      '--fw': String(S.font.bold ? 700 : 400),
      '--sw': S.font.outlineWidth + 'px',
      '--sc': S.font.outlineColor,
      '--boxbg': hexToRgba(S.box.color, S.box.alpha / 100),
      '--rad': S.box.radius + 'px',
      '--gap': S.layout.gap + 'px',
      '--spd': '.3s',
    },
  };
}

/** 리모컨에 남겨 두는 최근 채팅 수 (원본 RC_MAX) */
export const CHAT_MAX = 150;
export const CHAT_SIZE_MIN = 50;
export const CHAT_SIZE_MAX = 200;
export const CHAT_SIZE_STEP = 10;
export const clampChatSize = (v: number) => Math.max(CHAT_SIZE_MIN, Math.min(CHAT_SIZE_MAX, Math.round(v / CHAT_SIZE_STEP) * CHAT_SIZE_STEP));
