import { describe, expect, it } from 'vitest';
import { emptyVoteForm, validateVote, voteDurationSeconds } from './vote';

const ok = { ...emptyVoteForm(), name: '오늘 점심', minutes: '5', items: ['짜장', '짬뽕'] };
const now = Date.parse('2026-07-01T12:00:00');

describe('validateVote (p78)', () => {
  it('accepts a valid form', () => expect(validateVote(ok, now)).toBeNull());
  it('rejects an empty or 101-char name', () => {
    expect(validateVote({ ...ok, name: ' ' }, now)?.field).toBe('name');
    expect(validateVote({ ...ok, name: 'a'.repeat(101) }, now)?.field).toBe('name');
  });
  it('rejects a zero or malformed duration', () => {
    expect(validateVote({ ...ok, minutes: '' }, now)?.field).toBe('time');
    expect(validateVote({ ...ok, seconds: '61' }, now)?.field).toBe('time');
  });
  it('checks the price range', () => {
    expect(validateVote({ ...ok, price: '999' }, now)?.message).toBe('투표 금액은 1,000 ~ 20,000,000 캐시까지 설정 가능합니다.');
    expect(validateVote({ ...ok, price: '20000001' }, now)?.field).toBe('price');
  });
  it('caps free tickets at 100,000', () => expect(validateVote({ ...ok, freeTickets: '100001' }, now)?.field).toBe('freeTickets'));
  it('needs two items', () => expect(validateVote({ ...ok, items: ['짜장', ' '] }, now)?.field).toBe('items'));
  it('needs a future reservation time', () => {
    expect(validateVote({ ...ok, reserve: true, reserveAt: '2026-07-01T11:59:59' }, now)?.field).toBe('reserve');
    expect(validateVote({ ...ok, reserve: true, reserveAt: '2026-07-01T12:30:00' }, now)).toBeNull();
  });
});

describe('voteDurationSeconds', () => {
  it('sums the parts', () => expect(voteDurationSeconds({ ...ok, hours: '1', minutes: '2', seconds: '3' })).toBe(3723));
});
