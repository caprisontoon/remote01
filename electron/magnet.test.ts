import { describe, expect, it } from 'vitest';
import { attachedGroup, snap, touching } from './magnet';

const main = { x: 100, y: 100, width: 800, height: 600 };

describe('snap', () => {
  it('sticks to the right edge of the main window when close', () => {
    expect(snap({ x: 908, y: 200, width: 300, height: 200 }, [main]).x).toBe(900);
  });
  it('sticks to the left edge', () => {
    expect(snap({ x: -195, y: 200, width: 300, height: 200 }, [main]).x).toBe(-200);
  });
  it('aligns the top when glued to the side', () => {
    expect(snap({ x: 905, y: 108, width: 300, height: 200 }, [main])).toMatchObject({ x: 900, y: 100 });
  });
  it('ignores windows that are far away', () => {
    const r = { x: 1000, y: 200, width: 300, height: 200 };
    expect(snap(r, [main])).toEqual(r);
  });
});

describe('attachedGroup', () => {
  it('collects windows touching the anchor directly or through another window', () => {
    const wins = new Map([
      ['a', { x: 900, y: 100, width: 300, height: 200 }], // 메인 오른쪽에 붙음
      ['b', { x: 900, y: 300, width: 300, height: 200 }], // a 아래에 붙음
      ['c', { x: 1500, y: 100, width: 300, height: 200 }], // 떨어짐
    ]);
    expect(attachedGroup(main, wins).sort()).toEqual(['a', 'b']);
  });
  it('touching needs overlap on the other axis', () => {
    expect(touching(main, { x: 900, y: 800, width: 100, height: 100 })).toBe(false);
  });
});
