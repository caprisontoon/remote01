import { describe, expect, it } from 'vitest';
import { adjustSizes, buildTree, dockInto, minOf, organicResize } from './splitTree';
import { isValidLayout } from './grid';
import type { Tiles } from '../types';

const min = () => ({ w: 0.1, h: 0.1 });
const third = 1 / 3;
// A | B | C 세 열
const threeCols: Tiles = {
  donations: { x: 0, y: 0, w: third, h: 1 },
  quick: { x: third, y: 0, w: third, h: 1 },
  pending: { x: 2 * third, y: 0, w: third, h: 1 },
};

describe('adjustSizes (그룹 안 경계 이동 규칙)', () => {
  it('맞닿은 패널이 최소 크기에 닿으면 다음 패널을 줄인다 (연쇄 밀어내기)', () => {
    const r = adjustSizes([0.3, 0.3, 0.4], [0.1, 0.1, 0.1], 0, 0.35);
    expect(r[0]).toBeCloseTo(0.65);
    expect(r[1]).toBeCloseTo(0.1);
    expect(r[2]).toBeCloseTo(0.25);
  });
  it('줄일 수 있는 총량을 넘으면 그만큼만 움직인다', () => {
    const r = adjustSizes([0.3, 0.3, 0.4], [0.1, 0.1, 0.1], 0, 0.9);
    expect(r).toEqual([expect.closeTo(0.8), expect.closeTo(0.1), expect.closeTo(0.1)]);
  });
  it('늘어나는 쪽은 경계에 맞닿은 패널 하나만 커진다', () => {
    const r = adjustSizes([0.3, 0.3, 0.4], [0.1, 0.1, 0.1], 1, -0.1);
    expect(r[0]).toBeCloseTo(0.3);
    expect(r[1]).toBeCloseTo(0.2);
    expect(r[2]).toBeCloseTo(0.5);
  });
  it('왼쪽으로 밀 때도 반대 방향으로 연쇄한다', () => {
    // B가 0.2를 내주고 최소가 된 뒤, 남은 0.15를 A가 내준다
    const r = adjustSizes([0.3, 0.3, 0.4], [0.1, 0.1, 0.1], 1, -0.35);
    expect(r[0]).toBeCloseTo(0.15);
    expect(r[1]).toBeCloseTo(0.1);
    expect(r[2]).toBeCloseTo(0.75);
  });
});

describe('buildTree / minOf', () => {
  it('세 열을 한 가로 그룹으로 묶는다', () => {
    const t = buildTree(threeCols)!;
    expect(t.kind === 'split' && t.axis === 'x' && t.children.length).toBe(3);
  });
  it('같은 축 그룹은 최소 크기를 더하고 다른 축 그룹은 최댓값을 쓴다', () => {
    const t = buildTree(threeCols)!;
    expect(minOf(t, 'x', min)).toBeCloseTo(0.3);
    expect(minOf(t, 'y', min)).toBeCloseTo(0.1);
  });
});

describe('organicResize', () => {
  it('A의 오른쪽 경계를 끌면 B가 최소가 된 뒤 C까지 줄어든다', () => {
    const r = organicResize(threeCols, 'donations', 'right', 0.4, min);
    expect(r.donations!.w).toBeCloseTo(third + 0.4);
    expect(r.quick!.w).toBeCloseTo(0.1);
    expect(r.pending!.w).toBeCloseTo(1 - (third + 0.4) - 0.1);
    expect(isValidLayout(r)).toBe(true);
  });

  it('항상 드래그 시작 배치에서 계산하므로 되돌리면 원래대로 돌아온다 (탄성)', () => {
    organicResize(threeCols, 'donations', 'right', 0.4, min);
    const back = organicResize(threeCols, 'donations', 'right', 0, min);
    expect(back).toEqual(threeCols);
  });

  it('크기가 바뀐 그룹 안의 위젯들은 비율을 유지한다', () => {
    // A | (B 위 / C 아래, 3:1)
    const nested: Tiles = {
      donations: { x: 0, y: 0, w: 0.5, h: 1 },
      quick: { x: 0.5, y: 0, w: 0.5, h: 0.75 },
      pending: { x: 0.5, y: 0.75, w: 0.5, h: 0.25 },
    };
    const r = organicResize(nested, 'donations', 'right', 0.2, min);
    expect(r.quick!.x).toBeCloseTo(0.7);
    expect(r.quick!.w).toBeCloseTo(0.3);
    expect(r.pending!.w).toBeCloseTo(0.3);
    expect(r.quick!.h).toBeCloseTo(0.75); // 세로 비율 그대로
    expect(isValidLayout(r)).toBe(true);
  });

  it('안쪽 그룹의 경계는 그 그룹 안에서만 움직인다', () => {
    const nested: Tiles = {
      donations: { x: 0, y: 0, w: 0.5, h: 1 },
      quick: { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      pending: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    };
    const r = organicResize(nested, 'quick', 'bottom', 0.2, min);
    expect(r.donations).toEqual(nested.donations);
    expect(r.quick!.h).toBeCloseTo(0.7);
    expect(r.pending!.y).toBeCloseTo(0.7);
  });

  it('하한이 작아도 그룹 크기의 10%보다 작아지지 않는다 (Ground Control minSize 10)', () => {
    const tiny = () => ({ w: 0.01, h: 0.01 });
    const r = organicResize(threeCols, 'donations', 'right', 0.9, tiny, 0.1);
    expect(r.quick!.w).toBeCloseTo(0.1);
    expect(r.pending!.w).toBeCloseTo(0.1);
    expect(r.donations!.w).toBeCloseTo(0.8);
  });

  it('안쪽 그룹의 10%는 그 그룹 크기 기준이다', () => {
    const nested: Tiles = {
      donations: { x: 0, y: 0, w: 0.5, h: 1 },
      quick: { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      pending: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    };
    const r = organicResize(nested, 'quick', 'bottom', 0.9, () => ({ w: 0.01, h: 0.01 }), 0.1);
    expect(r.pending!.h).toBeCloseTo(0.1); // 오른쪽 열 높이 1의 10%
  });

  it('캔버스 바깥 경계는 움직이지 않는다', () => {
    expect(organicResize(threeCols, 'donations', 'left', 0.1, min)).toBe(threeCols);
  });

  it('여러 층으로 중첩된 배치에서도 빈틈이 생기지 않는다', () => {
    const t: Tiles = {
      donations: { x: 0, y: 0, w: 0.5, h: 0.6 },
      quick: { x: 0, y: 0.6, w: 0.5, h: 0.4 },
      pending: { x: 0.5, y: 0, w: 0.25, h: 1 },
      volume: { x: 0.75, y: 0, w: 0.25, h: 0.5 },
      vote: { x: 0.75, y: 0.5, w: 0.25, h: 0.5 },
    };
    for (const d of [-0.3, -0.1, 0.1, 0.35]) {
      const r = organicResize(t, 'donations', 'right', d, min);
      expect(isValidLayout(r)).toBe(true);
      for (const rect of Object.values(r)) expect(rect!.w).toBeGreaterThanOrEqual(0.1 - 1e-6);
    }
  });
});

describe('dockInto (공간 만들기)', () => {
  const m = () => ({ w: 0.2, h: 0.1 });
  // 왼쪽 위젯이 좁아 반으로 나눌 수 없지만 오른쪽에 여유가 있다
  const narrow: Tiles = {
    donations: { x: 0, y: 0, w: 0.3, h: 1 },
    quick: { x: 0.3, y: 0, w: 0.7, h: 1 },
  };

  it('대상이 작으면 이웃을 밀어 자리를 만든 뒤 나눈다', () => {
    const r = dockInto(narrow, 'donations', 'pending', 'right', m)!;
    expect(r).not.toBeNull();
    expect(isValidLayout(r)).toBe(true);
    for (const rect of Object.values(r)) expect(rect!.w).toBeGreaterThanOrEqual(0.2 - 1e-6);
    expect(r.pending!.x).toBeCloseTo(r.donations!.x + r.donations!.w);
  });

  it('캔버스 전체에 자리가 없으면 null', () => {
    // 0.2 × 5칸이 꽉 찼다 — 여섯 번째는 어디에도 못 들어간다
    const full: Tiles = {
      donations: { x: 0, y: 0, w: 0.2, h: 1 },
      quick: { x: 0.2, y: 0, w: 0.2, h: 1 },
      pending: { x: 0.4, y: 0, w: 0.2, h: 1 },
      volume: { x: 0.6, y: 0, w: 0.2, h: 1 },
      alerts: { x: 0.8, y: 0, w: 0.2, h: 1 },
    };
    expect(dockInto(full, 'quick', 'usage', 'right', m)).toBeNull();
  });

  it('다른 위젯이 이미 최소 크기보다 작아도(창을 줄인 경우) 나눌 수 있는 곳에는 놓인다', () => {
    const t: Tiles = { donations: { x: 0, y: 0, w: 0.9, h: 1 }, quick: { x: 0.9, y: 0, w: 0.1, h: 1 } };
    expect(dockInto(t, 'donations', 'pending', 'left', m)).not.toBeNull();
  });
});
