import { describe, expect, it } from 'vitest';
import { contentText, relativeTime, rowActions, sortDraws, tabOf } from './donation';
import type { Donation } from '../types';

const base: Donation = { id: '1', kind: 'text', donorId: 'd', nickname: 'n', account: 'a', cash: 1000, createdAt: 0 };

describe('relativeTime (p40)', () => {
  const min = 60_000;
  const day = 24 * 60 * min;
  it.each([
    [30_000, '방금'],
    [min, '1분'],
    [59 * min, '59분'],
    [60 * min, '1시간'],
    [day - 1, '23시간'],
    [day, '1일'],
    [29 * day, '29일'],
    [30 * day, '1개월'],
    [364 * day, '12개월'],
    [365 * day, '1년'],
    [5 * 365 * day, '5년'],
  ])('%i ms → %s', (diff, label) => {
    expect(relativeTime(0, diff)).toBe(label);
  });
});

describe('rowActions (p39)', () => {
  it('quest has no replay', () => expect(rowActions({ kind: 'quest', result: 'success' })).toEqual({ replay: false, block: true, wallpaper: true }));
  it('timed-out luckybox has block only', () => expect(rowActions({ kind: 'luckybox', result: 'timeout' })).toEqual({ replay: false, block: true, wallpaper: false }));
  it('draw has no block', () => expect(rowActions({ kind: 'draw' })).toEqual({ replay: true, block: false, wallpaper: true }));
  it('platform alerts are replay only', () => expect(rowActions({ kind: 'twitchRaid' })).toEqual({ replay: true, block: false, wallpaper: false }));
  it('creator TTS has nothing', () => expect(rowActions({ kind: 'creatorTts' })).toEqual({ replay: false, block: false, wallpaper: false }));
});

describe('content format (p39, p44)', () => {
  it('game shows quantity only for multiple items', () => {
    const game = { ...base, kind: 'game' as const, game: { name: '메이플', server: '스카니아', character: '용사', item: '물약' }, text: '화이팅' };
    expect(contentText({ ...game, quantity: 1 })).toBe('[메이플] [스카니아] [용사] [물약] 화이팅');
    expect(contentText({ ...game, quantity: 3 })).toBe('[메이플] [스카니아] [용사] [물약] 3개 화이팅');
  });
  it('video shows platform and title', () => {
    expect(contentText({ ...base, kind: 'video', platform: 'Youtube', title: '제목' })).toBe('[Youtube] 제목');
  });
  it('chzzk subscription shows months', () => {
    expect(contentText({ ...base, kind: 'chzzkSubscribe', months: 3 })).toBe('치지직 구독 알림 - 3개월');
  });
});

describe('tabs and draw order', () => {
  it('routes kinds to tabs', () => {
    expect(tabOf('game')).toBe('game');
    expect(tabOf('draw')).toBe('draw');
    expect(tabOf('video')).toBe('all');
  });
  it('puts completed draws below, newest first in each group', () => {
    const list = [
      { ...base, id: 'a', createdAt: 3, completed: true },
      { ...base, id: 'b', createdAt: 1 },
      { ...base, id: 'c', createdAt: 2 },
      { ...base, id: 'd', createdAt: 4, completed: true },
    ];
    expect(sortDraws(list).map((d) => d.id)).toEqual(['c', 'b', 'd', 'a']);
  });
});
