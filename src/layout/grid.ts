// 캔버스 그리드 엔진 (기획서 p18~25).
// 위젯은 캔버스를 빈틈·겹침 없이 나눠 갖는다. 좌표는 0~1 비율이며 모든 연산은 순수 함수다.
// 분할·교환·엣지 삽입·경계 리사이즈만 허용하므로 배치는 항상 "길로틴" 분할을 유지하고,
// 그래서 위젯을 닫았을 때 한쪽 이웃들이 빈 자리를 정확히 덮을 수 있다.

import type { CanvasEdge, DockDirection, Rect, Tiles, WidgetId } from '../types';

export const EPS = 1e-6;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-4;
const overlaps = (aStart: number, aSize: number, bStart: number, bSize: number) =>
  Math.max(aStart, bStart) < Math.min(aStart + aSize, bStart + bSize) - 1e-4;

/** 위젯별 최소 크기(캔버스 비율). 호출하는 쪽이 px 최소값을 현재 캔버스 크기로 나눠서 넘긴다. */
export type MinSize = (id: WidgetId) => { w: number; h: number };

type Entry = [WidgetId, Rect];
const entries = (tiles: Tiles) => Object.entries(tiles) as Entry[];
const clone = (tiles: Tiles): Tiles => Object.fromEntries(entries(tiles).map(([id, r]) => [id, { ...r }])) as Tiles;

function fitsMin(tiles: Tiles, min: MinSize): boolean {
  return entries(tiles).every(([id, r]) => r.w + 1e-4 >= min(id).w && r.h + 1e-4 >= min(id).h);
}

/** 대상 위젯을 1/2로 나누고 dir 쪽에 새 위젯을 놓는다. 최소 크기를 못 지키면 null. */
export function splitInto(tiles: Tiles, target: WidgetId, id: WidgetId, dir: Exclude<DockDirection, 'center'>, min: MinSize): Tiles | null {
  const t = tiles[target];
  if (!t || target === id) return null;
  const next = clone(tiles);
  const tr = next[target]!;
  let placed: Rect;
  if (dir === 'left' || dir === 'right') {
    const half = t.w / 2;
    placed = { x: dir === 'left' ? t.x : t.x + half, y: t.y, w: half, h: t.h };
    tr.w = half;
    if (dir === 'left') tr.x = t.x + half;
  } else {
    const half = t.h / 2;
    placed = { x: t.x, y: dir === 'top' ? t.y : t.y + half, w: t.w, h: half };
    tr.h = half;
    if (dir === 'top') tr.y = t.y + half;
  }
  next[id] = placed;
  return fitsMin(next, min) ? next : null;
}

/** 두 위젯의 위치·크기를 그대로 맞바꾼다 (p23). */
export function swapTiles(tiles: Tiles, a: WidgetId, b: WidgetId): Tiles | null {
  if (!tiles[a] || !tiles[b] || a === b) return null;
  const next = clone(tiles);
  next[a] = { ...tiles[b]! };
  next[b] = { ...tiles[a]! };
  return next;
}

/**
 * 캔버스 가장자리에 위젯을 삽입한다 (엣지 인디케이터).
 * 기존 위젯들을 해당 축으로 비례 축소하고 비운 띠에 새 위젯을 꽉 채운다.
 */
export function insertAtEdge(tiles: Tiles, id: WidgetId, edge: CanvasEdge, min: MinSize): Tiles | null {
  const others = entries(tiles).filter(([k]) => k !== id);
  const horizontal = edge === 'left' || edge === 'right';
  const lines = new Set(others.map(([, r]) => (horizontal ? r.x : r.y).toFixed(4)));
  const thickness = Math.min(0.5, Math.max(horizontal ? min(id).w : min(id).h, 1 / (lines.size + 1)));
  const scale = 1 - thickness;
  const next: Tiles = {};
  for (const [k, r] of others) {
    if (horizontal) {
      next[k] = { ...r, x: (edge === 'left' ? thickness : 0) + r.x * scale, w: r.w * scale };
    } else {
      next[k] = { ...r, y: (edge === 'top' ? thickness : 0) + r.y * scale, h: r.h * scale };
    }
  }
  next[id] = horizontal
    ? { x: edge === 'left' ? 0 : scale, y: 0, w: thickness, h: 1 }
    : { x: 0, y: edge === 'top' ? 0 : scale, w: 1, h: thickness };
  return fitsMin(next, min) ? next : null;
}

/** 범위 [start, end]를 이웃들이 틈 없이 정확히 덮는지. */
function coversRange(list: Rect[], start: number, end: number, axis: 'x' | 'y'): boolean {
  if (list.length === 0) return false;
  const pos = axis === 'x' ? 'x' : 'y';
  const size = axis === 'x' ? 'w' : 'h';
  const sorted = [...list].sort((a, b) => a[pos] - b[pos]);
  if (!near(sorted[0][pos], start)) return false;
  let cursor = sorted[0][pos] + sorted[0][size];
  for (let i = 1; i < sorted.length; i++) {
    if (!near(sorted[i][pos], cursor)) return false;
    cursor += sorted[i][size];
  }
  return near(cursor, end);
}

/** 위젯을 제거하고, 한쪽 면의 이웃들이 빈 자리를 덮도록 늘린다 (오른쪽→왼쪽→아래→위 순). */
export function removeTile(tiles: Tiles, id: WidgetId): Tiles {
  const t = tiles[id];
  if (!t) return tiles;
  const next = clone(tiles);
  delete next[id];
  const rest = entries(next);
  const within = (r: Rect, axis: 'x' | 'y') =>
    axis === 'y' ? r.y >= t.y - 1e-4 && r.y + r.h <= t.y + t.h + 1e-4 : r.x >= t.x - 1e-4 && r.x + r.w <= t.x + t.w + 1e-4;

  const sides: { pick: (r: Rect) => boolean; axis: 'x' | 'y'; grow: (r: Rect) => void }[] = [
    { pick: (r) => near(r.x, t.x + t.w) && within(r, 'y'), axis: 'y', grow: (r) => { r.x = t.x; r.w += t.w; } },
    { pick: (r) => near(r.x + r.w, t.x) && within(r, 'y'), axis: 'y', grow: (r) => { r.w += t.w; } },
    { pick: (r) => near(r.y, t.y + t.h) && within(r, 'x'), axis: 'x', grow: (r) => { r.y = t.y; r.h += t.h; } },
    { pick: (r) => near(r.y + r.h, t.y) && within(r, 'x'), axis: 'x', grow: (r) => { r.h += t.h; } },
  ];
  for (const side of sides) {
    const group = rest.filter(([, r]) => side.pick(r));
    const rects = group.map(([, r]) => r);
    const [start, end] = side.axis === 'y' ? [t.y, t.y + t.h] : [t.x, t.x + t.w];
    if (coversRange(rects, start, end, side.axis)) {
      rects.forEach(side.grow);
      return next;
    }
  }
  // 길로틴 배치에서는 도달하지 않는다. 혹시 모를 경우 남은 위젯으로 캔버스를 다시 채운다.
  return normalize(next);
}

/** 이동: 원래 자리를 메운 뒤 대상 위젯을 분할해 놓는다 (p24). 중앙이면 위치 교환. */
export function moveTile(tiles: Tiles, id: WidgetId, target: WidgetId, dir: DockDirection, min: MinSize): Tiles | null {
  if (id === target) return null;
  if (dir === 'center') return swapTiles(tiles, id, target);
  const without = removeTile(tiles, id);
  return splitInto(without, target, id, dir, min);
}

export function moveToEdge(tiles: Tiles, id: WidgetId, edge: CanvasEdge, min: MinSize): Tiles | null {
  const without = tiles[id] ? removeTile(tiles, id) : tiles;
  return insertAtEdge(without, id, edge, min);
}

/** 캔버스 바깥 경계에 닿은 면은 리사이즈할 수 없다 (p25 리사이징 제한). */
export function resizableEdges(r: Rect) {
  return {
    top: r.y > 1e-4,
    left: r.x > 1e-4,
    bottom: r.y + r.h < 1 - 1e-4,
    right: r.x + r.w < 1 - 1e-4,
  };
}

/** 위젯 집합이 캔버스를 다 덮지 않을 때(예: 저장된 레이아웃 손상) 세로 균등 분할로 복구한다. */
export function normalize(tiles: Tiles): Tiles {
  const ids = (Object.keys(tiles) as WidgetId[]);
  if (ids.length === 0) return {};
  if (isValidLayout(tiles)) return tiles;
  const w = 1 / ids.length;
  return Object.fromEntries(ids.map((id, i) => [id, { x: i * w, y: 0, w, h: 1 }])) as Tiles;
}

/** 겹침이 없고 캔버스 전체 면적을 정확히 덮는지 검사. */
export function isValidLayout(tiles: Tiles): boolean {
  const list = entries(tiles).map(([, r]) => r);
  if (list.length === 0) return true;
  let area = 0;
  for (const r of list) {
    if (r.x < -1e-4 || r.y < -1e-4 || r.x + r.w > 1 + 1e-4 || r.y + r.h > 1 + 1e-4 || r.w <= 0 || r.h <= 0) return false;
    area += r.w * r.h;
  }
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      if (overlaps(a.x, a.w, b.x, b.w) && overlaps(a.y, a.h, b.y, b.h)) return false;
    }
  }
  return Math.abs(area - 1) < 1e-3;
}

/** 드롭 결과 미리보기 영역 (반투명 블록, p19 배치 미리보기). */
export function previewRect(tiles: Tiles, drop: { kind: 'dock'; target: WidgetId; dir: DockDirection } | { kind: 'edge'; edge: CanvasEdge }): Rect | null {
  if (drop.kind === 'edge') {
    const t = 0.3;
    switch (drop.edge) {
      case 'left': return { x: 0, y: 0, w: t, h: 1 };
      case 'right': return { x: 1 - t, y: 0, w: t, h: 1 };
      case 'top': return { x: 0, y: 0, w: 1, h: t };
      case 'bottom': return { x: 0, y: 1 - t, w: 1, h: t };
    }
  }
  const r = tiles[drop.target];
  if (!r) return null;
  switch (drop.dir) {
    case 'left': return { ...r, w: r.w / 2 };
    case 'right': return { ...r, x: r.x + r.w / 2, w: r.w / 2 };
    case 'top': return { ...r, h: r.h / 2 };
    case 'bottom': return { ...r, y: r.y + r.h / 2, h: r.h / 2 };
    case 'center': return { ...r };
  }
}
