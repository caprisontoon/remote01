// 목업 데이터 생성기. 실제 서버 연동 전까지 화면과 동작을 확인하는 용도다.
import type { CrewMember, Donation, DonationKind, DrawBoard, PendingItem, ToneAd } from '../types';

let seq = 0;
export const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

// 결정적 난수 (화면이 매번 같은 모양으로 시작하도록)
let seed = 7;
export function rand(): number {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
export const pick = <T,>(list: readonly T[]): T => list[Math.floor(rand() * list.length)];

const NICKS = ['피곤한고양이', '열혈팬01', '나그네', '도전자A', '밤하늘별', '초코송이', '뚱땅이', '감자칩러버', '새벽두시', '라면한그릇', '고독한미식가', '오늘도출근'];
const DOMAINS = ['gmail.com', 'naver.com', 'kakao.com'];
const TEXTS = [
  '오늘 방송 너무 재밌어요! 항상 응원합니다',
  '점심 맛있게 드세요~',
  '방금 그 장면 레전드ㅋㅋㅋㅋ 다시 보고 싶어요',
  '퇴근길에 듣고 있어요. 목소리 최고!',
  '다음 게임은 뭐 할 거예요? 공포게임 해주세요 제발',
  '구독 1주년 기념 후원입니다 🎉',
  '노래 한 곡 불러주세요!!',
];
const VIDEO_TITLES = ['오늘의 하이라이트 모음', '고양이가 키보드를 밟았을 때', '전설의 역전승 장면', '10시간 반복 BGM', '신작 게임 트레일러'];
const PRODUCTS = ['빼빼로', '초콜릿 세트', '무선 마우스', '커피 기프티콘', '키보드 손목받침'];

export function donor() {
  const nickname = pick(NICKS);
  const local = `${nickname.length}${Math.floor(rand() * 90 + 10)}lo`;
  return { donorId: `donor-${nickname}`, nickname, account: `${local}***@${pick(DOMAINS)}` };
}

const PALETTE = ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#ec4899', '#0ea5e9'];

/** 외부 이미지 없이 쓰는 썸네일 (오프라인·Electron에서도 보이도록 SVG data URI). */
export function thumb(label: string, kind: 'video' | 'gift' | 'ad' = 'video'): string {
  const c1 = pick(PALETTE);
  const c2 = pick(PALETTE);
  const icon =
    kind === 'video'
      ? '<circle cx="160" cy="90" r="30" fill="rgba(255,255,255,.85)"/><path d="M150 75 L175 90 L150 105 Z" fill="#111"/>'
      : kind === 'gift'
        ? '<rect x="130" y="70" width="60" height="45" rx="4" fill="rgba(255,255,255,.85)"/><rect x="156" y="62" width="8" height="53" fill="#ef4444"/>'
        : '<text x="160" y="105" font-size="44" font-weight="900" text-anchor="middle" fill="rgba(255,255,255,.9)" font-family="sans-serif">AD</text>';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="320" height="180" fill="url(#g)"/>${icon}<text x="12" y="168" font-size="14" fill="white" font-family="sans-serif">${label.replace(/[<&>]/g, '')}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const CASHES = [1000, 1000, 2000, 3000, 5000, 10000, 500, 50000];

export function makeDonation(kind: DonationKind, createdAt: number): Donation {
  const base: Donation = { id: uid('don'), kind, ...donor(), cash: pick(CASHES), createdAt };
  switch (kind) {
    case 'text':
    case 'mini':
      return { ...base, text: pick(TEXTS) };
    case 'signature':
      return { ...base, title: '시그니처 #3 하트뿅뿅', text: pick(TEXTS) };
    case 'voice':
      return base;
    case 'video': {
      const title = pick(VIDEO_TITLES);
      return { ...base, platform: 'Youtube', title, thumbnail: thumb(title), url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
    }
    case 'roulette':
      return { ...base, title: '운명의 룰렛', item: pick(['꽝', '노래 한 곡', '애교 3종', '스쿼트 10회']) };
    case 'wishlist':
      return { ...base, item: pick(PRODUCTS), text: pick(TEXTS) };
    case 'vote':
      return { ...base, title: '오늘 점심 뭐 먹지?', item: pick(['짜장면', '짬뽕', '탕수육']) };
    case 'quest':
      return { ...base, title: '5연킬 달성하기', result: rand() > 0.4 ? 'success' : 'fail' };
    case 'drawing':
      return { ...base, title: '방장 초상화' };
    case 'gift': {
      const item = pick(PRODUCTS);
      return { ...base, item, quantity: Math.ceil(rand() * 3), thumbnail: thumb(item, 'gift'), text: pick(TEXTS) };
    }
    case 'luckybox':
      return { ...base, result: pick(['win', 'lose', 'timeout'] as const) };
    case 'play':
      return { ...base, title: pick(['객관식', '초성', '그림']), result: pick(['correct', 'wrong', 'timeout'] as const) };
    case 'game':
      return {
        ...base,
        game: { name: pick(['메이플스토리', '로스트아크', '던전앤파이터']), server: pick(['스카니아', '루페온', '카인']), character: pick(['용사킴', '마법소녀', '탱커장인']), item: pick(['엘릭서', '강화석', '골드 상자']) },
        quantity: pick([1, 1, 3, 10]),
        text: pick(TEXTS),
      };
    case 'draw':
      return { ...base, title: pick(['크리스마스 뽑기', '설날 뽑기', '심심한 날 그냥']), item: pick(['오늘의 셀카', '꽝', '빼빼로', '리액션']) };
    case 'ytSuperchat':
      return { ...base, amountLabel: pick(['₩10,000', '$5.00', '¥500']) };
    case 'chzzkSubscribe':
    case 'twitchSubscribe':
      return { ...base, months: Math.ceil(rand() * 24) };
    default:
      return base;
  }
}

/** 시뮬레이터가 새로 들어오는 후원 종류를 고를 때 쓰는 가중치. */
export const INCOMING_KINDS: DonationKind[] = [
  'text', 'text', 'text', 'mini', 'video', 'voice', 'roulette', 'wishlist', 'gift', 'signature', 'game', 'draw', 'draw',
  'quest', 'luckybox', 'play', 'drawing', 'vote', 'ytSuperchat', 'chzzkCheese', 'twitchBits', 'twitchRaid', 'ytMembership',
];

export function initialDonations(now: number): Donation[] {
  const offsets = [5e3, 40e3, 3 * 60e3, 10 * 60e3, 3 * 3600e3, 19 * 3600e3, 3 * 86400e3, 29 * 86400e3, 60 * 86400e3, 330 * 86400e3, 5 * 365 * 86400e3];
  const kinds: DonationKind[] = ['text', 'video', 'mini', 'roulette', 'wishlist', 'quest', 'drawing', 'gift', 'luckybox', 'play', 'signature', 'voice', 'chzzkSubscribe', 'twitchRaid', 'ytSuperchat', 'creatorTts'];
  const list: Donation[] = [];
  kinds.forEach((k, i) => list.push(makeDonation(k, now - offsets[i % offsets.length] - i * 1000)));
  for (let i = 0; i < 12; i++) list.push(makeDonation('game', now - offsets[i % offsets.length] - i * 7000));
  for (let i = 0; i < 14; i++) list.push(makeDonation('draw', now - offsets[i % offsets.length] - i * 9000));
  return list;
}

/** 뽑기 검색용 과거 이력 (1,000건 초과 안내를 확인할 수 있도록 넉넉히). */
export function drawHistory(now: number, count: number): Donation[] {
  const list: Donation[] = [];
  for (let i = 0; i < count; i++) {
    const d = makeDonation('draw', now - i * 37 * 60_000);
    list.push({ ...d, completed: true });
  }
  return list;
}

export function initialDrawBoards(): DrawBoard[] {
  return [
    { id: 'xmas', name: '크리스마스 뽑기', consumable: true, prizes: [
      { name: '빼빼로', remain: 1, total: 10 }, { name: '초콜릿', remain: 4, total: 10 }, { name: '리액션', remain: 7, total: 10 }, { name: '꽝', remain: 9, total: 10 },
    ] },
    { id: 'newyear', name: '설날 뽑기', consumable: true, prizes: [
      { name: '세뱃돈 봉투', remain: 2, total: 5 }, { name: '덕담 한마디', remain: 12, total: 20 },
    ] },
    { id: 'casual', name: '심심한 날 그냥', consumable: false, prizes: [] },
  ];
}

export function makePending(kind: PendingItem['kind'], now: number): PendingItem {
  const d = donor();
  const base = { id: uid('pend'), ...d, cash: pick([3000, 5000, 10000]), createdAt: now, deadline: now + pick([45, 90, 180]) * 1000 };
  switch (kind) {
    case 'quest':
      return { ...base, kind, title: pick(['성공하면 한강 입수', '5연킬 달성하기', '웃음 참기 1분']), accepted: false };
    case 'luckybox':
      return { ...base, kind, boxes: 6 };
    case 'play': {
      const mode = pick(['choice', 'initial', 'drawing'] as const);
      return {
        ...base,
        kind,
        challenging: false,
        mode,
        limitSeconds: 60,
        question: mode === 'choice' ? '투네이션 리모컨의 첫 출시 연도는?' : mode === 'initial' ? 'ㄹㅁㅋ' : '그림을 보고 단어를 맞혀 주세요',
        choices: mode === 'choice' ? ['2016', '2017', '2018', '2019'] : undefined,
        hint: mode === 'initial' ? '방송을 원격으로 조종하는 것' : undefined,
        answerLength: mode === 'choice' ? undefined : 3,
      };
    }
    case 'video': {
      const title = pick(VIDEO_TITLES);
      return { ...base, kind, title, platform: 'Youtube', thumbnail: thumb(title), url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
    }
  }
}

export function initialAds(): ToneAd[] {
  const ads: ToneAd[] = [];
  const brands = ['투네이션', '맛있는치킨', '게임즈코리아', '에너지드링크', '모바일RPG'];
  for (let i = 0; i < 9; i++) {
    const title = `${pick(['신규 오픈', '여름 이벤트', '사전예약', '할인 특가'])} 광고 ${i + 1}`;
    ads.push({
      id: uid('ad'),
      advertiser: brands[i % brands.length],
      title,
      cash: pick([1000, 2000, 3000]),
      durationSec: pick([15, 30, 60]),
      thumbnail: thumb(title, 'ad'),
      playable: i % 4 !== 3,
      playedAt: i >= 6 ? Date.now() - i * 3600e3 : undefined,
    });
  }
  return ads;
}

/** 후원 점수는 방송마다 0에서 시작하고, 기여도는 시즌 누적이다 */
export function crewMembers(): CrewMember[] {
  return [
    { id: 'c1', rank: '대표', name: '방장킴', joined: true, score: 0, contribution: 128000 },
    { id: 'c2', rank: '부장', name: '노래하는곰', joined: true, score: 0, contribution: 94500 },
    { id: 'c3', rank: '차장', name: '드립장인', joined: true, score: 0, contribution: 70100 },
    { id: 'c4', rank: '대리', name: '조용한막내', joined: true, score: 0, contribution: 51000 },
    { id: 'c5', rank: '사원', name: '신입이에요', joined: true, score: 0, contribution: -3000 },
    { id: 'c6', rank: '인턴', name: '쉬는중', joined: false, score: 0, contribution: 12000 },
  ];
}
