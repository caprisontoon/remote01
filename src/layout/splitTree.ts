// 유기적 리사이즈 (Ground Control 방식).
//
// Ground Control은 위젯을 가로/세로 그룹이 중첩된 트리로 관리하고, 경계를 끌면
//   1) 줄어드는 쪽: 맞닿은 패널부터 줄이고, 최소 크기에 닿으면 그다음 패널을 줄인다 (연쇄 밀어내기)
//   2) 늘어나는 쪽: 경계에 맞닿은 패널 하나만 늘어난다
//   3) 계산은 항상 드래그 시작 시점 배치를 기준으로 한다 → 되돌리면 밀렸던 패널도 원래대로 (탄성)
//   4) 크기가 바뀐 그룹 안의 위젯들은 비율을 유지한 채 함께 커지고 작아진다
//   5) 각 패널은 자기 그룹 크기의 10%까지 줄어든다 (react-resizable-panels minSize 10)
// 우리 캔버스는 항상 길로틴 분할이라, 타일 사각형에서 같은 그룹 트리를 다시 만들 수 있다.

import type { CanvasEdge, DockDirection, Rect, Tiles, WidgetId } from '../types';
import { splitInto, type MinSize } from './grid';

const E = 1e-6;
type Axis = 'x' | 'y';

export type SplitNode =
  | { kind: 'leaf'; id: WidgetId; rect: Rect }
  | { kind: 'split'; axis: Axis; rect: Rect; children: SplitNode[] };

const start = (r: Rect, a: Axis) => (a === 'x' ? r.x : r.y);
const size = (r: Rect, a: Axis) => (a === 'x' ? r.w : r.h);
const end = (r: Rect, a: Axis) => start(r, a) + size(r, a);

function bounds(list: [WidgetId, Rect][]): Rect {
  const x = Math.min(...list.map(([, r]) => r.x));
  const y = Math.min(...list.map(([, r]) => r.y));
  const x2 = Math.max(...list.map(([, r]) => r.x + r.w));
  const y2 = Math.max(...list.map(([, r]) => r.y + r.h));
  return { x, y, w: x2 - x, h: y2 - y };
}

/** 이 축으로 모든 타일을 가로지르지 않고 자를 수 있는 위치들 (그룹의 경계). */
function cuts(list: [WidgetId, Rect][], axis: Axis, box: Rect): number[] {
  const lo = start(box, axis);
  const hi = end(box, axis);
  const candidates = [...new Set(list.map(([, r]) => +end(r, axis).toFixed(6)))].filter((c) => c > lo + E && c < hi - E);
  return candidates.filter((c) => list.every(([, r]) => !(start(r, axis) < c - E && end(r, axis) > c + E))).sort((a, b) => a - b);
}

/** 타일 사각형에서 그룹 트리를 만든다. 가로(열) 분할을 먼저 찾고, 없으면 세로(행) 분할. */
export function buildTree(tiles: Tiles): SplitNode | null {
  const list = Object.entries(tiles) as [WidgetId, Rect][];
  if (list.length === 0) return null;
  return build(list);
}

function build(list: [WidgetId, Rect][]): SplitNode {
  if (list.length === 1) return { kind: 'leaf', id: list[0][0], rect: { ...list[0][1] } };
  const box = bounds(list);
  for (const axis of ['x', 'y'] as Axis[]) {
    const cs = cuts(list, axis, box);
    if (!cs.length) continue;
    const edges = [start(box, axis), ...cs, end(box, axis)];
    const children: SplitNode[] = [];
    for (let i = 0; i < edges.length - 1; i++) {
      const part = list.filter(([, r]) => start(r, axis) >= edges[i] - E && end(r, axis) <= edges[i + 1] + E);
      if (part.length) children.push(build(part));
    }
    return { kind: 'split', axis, rect: box, children };
  }
  // 길로틴이 아닌 배치(정상적이면 나오지 않음): 첫 타일만 잎으로 두고 나머지를 묶는다
  return { kind: 'split', axis: 'x', rect: box, children: list.map(([id, rect]) => ({ kind: 'leaf', id, rect: { ...rect } })) };
}

/** 서브트리가 이 축으로 줄어들 수 있는 최소 크기. 같은 축 그룹은 합, 다른 축 그룹은 최댓값. */
export function minOf(node: SplitNode, axis: Axis, min: MinSize): number {
  if (node.kind === 'leaf') return axis === 'x' ? min(node.id).w : min(node.id).h;
  const mins = node.children.map((c) => minOf(c, axis, min));
  return node.axis === axis ? mins.reduce((a, b) => a + b, 0) : Math.max(...mins);
}

/**
 * 한 그룹 안의 크기 배열에 경계 이동을 적용한다 (Ground Control이 쓰는 react-resizable-panels의 계산 규칙과 같은 동작).
 * pivot: 경계 왼쪽(위쪽) 패널 인덱스. delta > 0 이면 경계가 오른쪽(아래)으로 간다.
 */
export function adjustSizes(sizes: number[], mins: number[], pivot: number, delta: number): number[] {
  if (Math.abs(delta) < E) return sizes;
  const next = [...sizes];
  const shrinkStep = delta > 0 ? 1 : -1; // 줄어드는 쪽으로 진행하는 방향
  const shrinkFrom = delta > 0 ? pivot + 1 : pivot;
  const growAt = delta > 0 ? pivot : pivot + 1;

  // 줄어드는 쪽 전체가 내줄 수 있는 양을 넘지 않게 제한
  let capacity = 0;
  for (let i = shrinkFrom; i >= 0 && i < sizes.length; i += shrinkStep) capacity += Math.max(0, sizes[i] - mins[i]);
  let remaining = Math.min(Math.abs(delta), capacity);
  const applied = remaining;

  // 맞닿은 패널부터 차례로 줄인다 (최소 크기에 닿으면 다음 패널로 연쇄)
  for (let i = shrinkFrom; i >= 0 && i < sizes.length && remaining > E; i += shrinkStep) {
    const take = Math.min(remaining, Math.max(0, sizes[i] - mins[i]));
    next[i] = sizes[i] - take;
    remaining -= take;
  }
  // 늘어나는 쪽은 경계에 맞닿은 패널 하나만
  next[growAt] = sizes[growAt] + applied;
  return next;
}

/** 서브트리를 새 영역에 맞춰 비율대로 다시 배치한다. */
function place(node: SplitNode, rect: Rect): SplitNode {
  if (node.kind === 'leaf') return { ...node, rect };
  const a = node.axis;
  const old = size(node.rect, a) || 1;
  let cursor = start(rect, a);
  const children = node.children.map((c, i) => {
    const s = i === node.children.length - 1 ? end(rect, a) - cursor : (size(c.rect, a) / old) * size(rect, a);
    const r = a === 'x' ? { x: cursor, y: rect.y, w: s, h: rect.h } : { x: rect.x, y: cursor, w: rect.w, h: s };
    cursor += s;
    return place(c, r);
  });
  return { ...node, rect, children };
}

/** 비율 축소로 최소 크기를 밑돈 위젯이 생기면, 같은 그룹의 여유 있는 위젯에서 덜어 채운다. */
function enforceMins(node: SplitNode, min: MinSize): SplitNode {
  if (node.kind === 'leaf') return node;
  const a = node.axis;
  const mins = node.children.map((c) => minOf(c, a, min));
  let sizes = node.children.map((c) => size(c.rect, a));
  const deficit = sizes.reduce((n, s, i) => n + Math.max(0, mins[i] - s), 0);
  if (deficit > E) {
    sizes = sizes.map((s, i) => Math.max(s, mins[i]));
    let over = deficit;
    const order = sizes.map((s, i) => [s - mins[i], i] as const).sort((p, q) => q[0] - p[0]);
    for (const [, i] of order) {
      if (over <= E) break;
      const take = Math.min(over, sizes[i] - mins[i]);
      sizes[i] -= take;
      over -= take;
    }
  }
  return enforceChildren({ ...node, children: node.children }, sizes, min);
}

function enforceChildren(node: Extract<SplitNode, { kind: 'split' }>, sizes: number[], min: MinSize): SplitNode {
  const a = node.axis;
  let cursor = start(node.rect, a);
  const children = node.children.map((c, i) => {
    const r = a === 'x' ? { x: cursor, y: node.rect.y, w: sizes[i], h: node.rect.h } : { x: node.rect.x, y: cursor, w: node.rect.w, h: sizes[i] };
    cursor += sizes[i];
    return enforceMins(place(c, r), min);
  });
  return { ...node, children };
}

function leaves(node: SplitNode, out: Tiles = {}): Tiles {
  if (node.kind === 'leaf') out[node.id] = node.rect;
  else node.children.forEach((c) => leaves(c, out));
  return out;
}

/** 위젯이 들어 있는 경로를 따라, 이 경계를 가진 가장 깊은 그룹을 찾는다. */
function findGroup(node: SplitNode, id: WidgetId, axis: Axis, seam: number): { group: Extract<SplitNode, { kind: 'split' }>; pivot: number } | null {
  if (node.kind === 'leaf') return null;
  const idx = node.children.findIndex((c) => contains(c, id));
  if (idx < 0) return null;
  const deeper = findGroup(node.children[idx], id, axis, seam);
  if (deeper) return deeper;
  if (node.axis !== axis) return null;
  for (let i = 0; i < node.children.length - 1; i++) {
    if (Math.abs(end(node.children[i].rect, axis) - seam) < 1e-4 && (i === idx || i + 1 === idx)) return { group: node, pivot: i };
  }
  return null;
}

const contains = (node: SplitNode, id: WidgetId): boolean => (node.kind === 'leaf' ? node.id === id : node.children.some((c) => contains(c, id)));

function replace(node: SplitNode, target: SplitNode, next: SplitNode): SplitNode {
  if (node === target) return next;
  if (node.kind === 'leaf') return node;
  return { ...node, children: node.children.map((c) => replace(c, target, next)) };
}

/**
 * 위젯 가장자리를 delta(캔버스 비율)만큼 끌었을 때의 새 배치.
 * base는 드래그 시작 시점 배치 — 매 이동마다 base에서 다시 계산해야 탄성 있게 되돌아온다.
 * minRatio: 그룹 안 패널이 줄어들 수 있는 한계(그룹 크기 대비). min(위젯 하한)과 둘 중 큰 값을 쓴다.
 */
export function organicResize(base: Tiles, id: WidgetId, edge: CanvasEdge, delta: number, min: MinSize, minRatio = 0): Tiles {
  const t = base[id];
  const tree = buildTree(base);
  if (!t || !tree || Math.abs(delta) < E) return base;
  const axis: Axis = edge === 'left' || edge === 'right' ? 'x' : 'y';
  const seam = edge === 'left' ? t.x : edge === 'right' ? t.x + t.w : edge === 'top' ? t.y : t.y + t.h;
  if (seam < 1e-4 || seam > 1 - 1e-4) return base; // 캔버스 바깥 경계는 고정 (기획서 p25)
  const hit = findGroup(tree, id, axis, seam);
  if (!hit) return base;
  const { group, pivot } = hit;
  const sizes = group.children.map((c) => size(c.rect, axis));
  const floor = size(group.rect, axis) * minRatio;
  const mins = group.children.map((c) => Math.max(minOf(c, axis, min), floor));
  const nextSizes = adjustSizes(sizes, mins, pivot, delta);
  const resized = enforceChildren(group, nextSizes, min);
  return leaves(replace(tree, group, resized));
}

const minAlong = (m: { w: number; h: number }, a: Axis) => (a === 'x' ? m.w : m.h);

/**
 * 대상 위젯을 나눠 새 위젯을 놓는다. 대상이 작아 나눌 수 없으면 이웃을 밀어(organicResize) 대상을 먼저 키운다.
 * 캔버스 전체에 자리가 없을 때만 null — 대상 하나가 작다고 "공간 부족"이 되지 않게 한다.
 */
export function dockInto(tiles: Tiles, target: WidgetId, id: WidgetId, dir: Exclude<DockDirection, 'center'>, min: MinSize, minRatio = 0): Tiles | null {
  const direct = splitInto(tiles, target, id, dir, min);
  if (direct) return direct;
  if (!tiles[target]) return null;
  const splitAxis: Axis = dir === 'left' || dir === 'right' ? 'x' : 'y';
  let next = tiles;
  for (const axis of ['x', 'y'] as Axis[]) {
    const each = Math.max(minAlong(min(target), axis), minAlong(min(id), axis));
    const need = axis === splitAxis ? 2 * each : each;
    // 새 위젯이 들어갈 쪽 경계부터 밀고, 모자라면 반대쪽 경계도 민다
    const edges: CanvasEdge[] = axis === 'x' ? (dir === 'left' ? ['left', 'right'] : ['right', 'left']) : dir === 'top' ? ['top', 'bottom'] : ['bottom', 'top'];
    for (const edge of edges) {
      const short = need - size(next[target]!, axis);
      if (short <= E) break;
      next = organicResize(next, target, edge, edge === 'right' || edge === 'bottom' ? short : -short, min, minRatio);
    }
  }
  return splitInto(next, target, id, dir, min);
}
