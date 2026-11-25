import { describe, expect, it } from 'vitest';
import { insertAtEdge, isValidLayout, moveTile, moveToEdge, removeTile, resizableEdges, splitInto, swapTiles } from './grid';
import type { Tiles } from '../types';

const noMin = () => ({ w: 0.05, h: 0.05 });
const full: Tiles = { donations: { x: 0, y: 0, w: 1, h: 1 } };

describe('splitInto', () => {
  it('splits the target in half on the chosen side', () => {
    const r = splitInto(full, 'donations', 'quick', 'bottom', noMin)!;
    expect(r.donations).toEqual({ x: 0, y: 0, w: 1, h: 0.5 });
    expect(r.quick).toEqual({ x: 0, y: 0.5, w: 1, h: 0.5 });
    expect(isValidLayout(r)).toBe(true);
  });

  it('puts the new widget on the left and shifts the target', () => {
    const r = splitInto(full, 'donations', 'pending', 'left', noMin)!;
    expect(r.pending).toEqual({ x: 0, y: 0, w: 0.5, h: 1 });
    expect(r.donations).toEqual({ x: 0.5, y: 0, w: 0.5, h: 1 });
  });

  it('refuses a split that would break a minimum size', () => {
    expect(splitInto(full, 'donations', 'quick', 'left', () => ({ w: 0.6, h: 0.1 }))).toBeNull();
  });
});

describe('removeTile', () => {
  it('lets the neighbour fill the gap', () => {
    const two = splitInto(full, 'donations', 'quick', 'right', noMin)!;
    expect(removeTile(two, 'quick')).toEqual(full);
  });

  it('keeps a full partition after nested splits and removals', () => {
    let t = splitInto(full, 'donations', 'quick', 'right', noMin)!;
    t = splitInto(t, 'quick', 'pending', 'bottom', noMin)!;
    t = splitInto(t, 'donations', 'volume', 'top', noMin)!;
    t = splitInto(t, 'pending', 'vote', 'left', noMin)!;
    expect(isValidLayout(t)).toBe(true);
    for (const id of ['vote', 'volume', 'quick'] as const) {
      t = removeTile(t, id);
      expect(isValidLayout(t)).toBe(true);
    }
    expect(Object.keys(t).sort()).toEqual(['donations', 'pending']);
  });
});

describe('swap and move', () => {
  it('swaps positions and sizes', () => {
    const two = splitInto(full, 'donations', 'quick', 'right', noMin)!;
    const s = swapTiles(two, 'donations', 'quick')!;
    expect(s.donations).toEqual(two.quick);
    expect(s.quick).toEqual(two.donations);
  });

  it('moves a widget next to another one', () => {
    let t = splitInto(full, 'donations', 'quick', 'right', noMin)!;
    t = splitInto(t, 'quick', 'pending', 'bottom', noMin)!;
    const m = moveTile(t, 'pending', 'donations', 'top', noMin)!;
    expect(isValidLayout(m)).toBe(true);
    expect(m.pending!.x).toBe(0);
    expect(m.pending!.y).toBe(0);
    expect(m.quick).toEqual({ x: 0.5, y: 0, w: 0.5, h: 1 });
  });

  it('center direction swaps', () => {
    const t = splitInto(full, 'donations', 'quick', 'right', noMin)!;
    expect(moveTile(t, 'quick', 'donations', 'center', noMin)).toEqual(swapTiles(t, 'quick', 'donations'));
  });
});

describe('edge insert', () => {
  it('inserts a full-height strip at the left edge and scales the rest', () => {
    const t = splitInto(full, 'donations', 'quick', 'bottom', noMin)!;
    const r = insertAtEdge(t, 'pending', 'left', noMin)!;
    expect(isValidLayout(r)).toBe(true);
    expect(r.pending!.x).toBe(0);
    expect(r.pending!.h).toBe(1);
    expect(r.donations!.x).toBeCloseTo(r.pending!.w);
  });

  it('moving an existing tile to an edge keeps a valid layout', () => {
    let t = splitInto(full, 'donations', 'quick', 'right', noMin)!;
    t = splitInto(t, 'quick', 'pending', 'bottom', noMin)!;
    const r = moveToEdge(t, 'pending', 'top', noMin)!;
    expect(isValidLayout(r)).toBe(true);
    expect(r.pending).toMatchObject({ x: 0, y: 0, w: 1 });
  });
});

describe('resize', () => {
  it('canvas border edges are locked', () => {
    expect(resizableEdges({ x: 0, y: 0, w: 0.5, h: 1 })).toEqual({ top: false, left: false, bottom: false, right: true });
  });
});
