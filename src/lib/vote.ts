import type { VoteForm } from '../types';

export type VoteField = 'name' | 'time' | 'price' | 'freeTickets' | 'items' | 'reserve';

export const VOTE_ITEM_MAX = 20;
export const VOTE_ITEM_TEXT_MAX = 10;

export function emptyVoteForm(): VoteForm {
  return { name: '', hours: '', minutes: '', seconds: '', price: '1000', freeTickets: '0', items: ['', ''], reserve: false, reserveAt: '' };
}

const isDigits = (s: string) => /^\d+$/.test(s);

export function voteDurationSeconds(f: VoteForm): number | null {
  const parts = [f.hours, f.minutes, f.seconds].map((p) => (p === '' ? '0' : p));
  if (!parts.every(isDigits)) return null;
  const [h, m, s] = parts.map(Number);
  if (m > 59 || s > 59) return null;
  const total = h * 3600 + m * 60 + s;
  return total > 0 ? total : null;
}

/** 투표 필수 입력 사항 검증 (p78). 첫 번째 오류만 돌려주며 해당 칸으로 포커스한다. */
export function validateVote(f: VoteForm, now: number): { field: VoteField; message: string } | null {
  const name = f.name.trim();
  if (name.length < 1 || name.length > 100) return { field: 'name', message: '투표 이름은 1~100자까지 입력 가능합니다.' };
  if (voteDurationSeconds(f) === null) return { field: 'time', message: '투표 시간을 올바르게 입력해 주세요.' };
  const price = Number(f.price);
  if (!isDigits(f.price) || price < 1000 || price > 20_000_000) {
    return { field: 'price', message: '투표 금액은 1,000 ~ 20,000,000 캐시까지 설정 가능합니다.' };
  }
  const free = Number(f.freeTickets === '' ? '0' : f.freeTickets);
  if (!isDigits(f.freeTickets === '' ? '0' : f.freeTickets) || free > 100_000) {
    return { field: 'freeTickets', message: '무료 투표권은 0 ~ 100,000까지 설정 가능합니다.' };
  }
  if (f.items.filter((i) => i.trim()).length < 2) return { field: 'items', message: '투표 항목을 2개 이상 입력해 주세요.' };
  if (f.reserve) {
    const at = Date.parse(f.reserveAt);
    if (!f.reserveAt || Number.isNaN(at) || at <= now) {
      return { field: 'reserve', message: '투표 시작 예약 시간을 현재 시간보다 이 후로 설정해 주세요.' };
    }
  }
  return null;
}
