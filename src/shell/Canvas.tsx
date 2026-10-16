import { ArrowLeftRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, PanelBottom, PanelLeft, PanelRight, PanelTop } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { api, layoutStore } from '../state/app';
import { uiStore } from '../state/ui';
import { useStore } from '../state/store';
import { insertAtEdge, moveTile, moveToEdge, previewRect, removeTile, resizableEdges, resizeEdge, splitInto, type MinSize } from '../layout/grid';
import { desktop } from '../platform';
import type { CanvasEdge, DockDirection, DropTarget, Rect, Tiles, WidgetId } from '../types';
import { WIDGETS, isFixedWidget } from '../widgets/meta';
import { WIDGET_COMPONENTS } from '../widgets/registry';
import { WidgetFrame } from './WidgetFrame';

const GAP = 6;
const FLOAT_W = 360;
const FLOAT_H = 300;

type Source = 'tile' | 'placing' | 'external';
interface Drag {
  id: WidgetId;
  source: Source;
  /** 포인터 위치 (캔버스 기준 px) */
  x: number;
  y: number;
  /** 잡은 지점 오프셋 */
  ox: number;
  oy: number;
  w: number;
  h: number;
  outside: boolean;
}

function readDrop(clientX: number, clientY: number): DropTarget | null {
  for (const el of document.elementsFromPoint(clientX, clientY)) {
    const raw = (el as HTMLElement).dataset?.drop;
    if (raw) return JSON.parse(raw) as DropTarget;
  }
  return null;
}

export function Canvas({ bottomInset }: { bottomInset: number }) {
  const tiles = useStore(layoutStore, (s) => s.tiles);
  const placing = useStore(uiStore, (s) => s.placing);
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const [drag, setDrag] = useState<Drag | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);

  useLayoutEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.max(1, e.contentRect.width), h: Math.max(1, e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const min: MinSize = useCallback((id) => ({ w: WIDGETS[id].minWidth / size.w, h: WIDGETS[id].minHeight / size.h }), [size]);

  const setTiles = (next: Tiles) => layoutStore.set({ tiles: next });

  /** 드롭 적용. 최소 크기를 못 지키면 배치하지 않는다 (p18 최소 사이즈 보호). */
  const place = useCallback(
    (id: WidgetId, d: DropTarget, source: Source): boolean => {
      const current = layoutStore.get().tiles;
      let next: Tiles | null = null;
      if (d.kind === 'edge') next = source === 'tile' ? moveToEdge(current, id, d.edge, min) : insertAtEdge(current, id, d.edge, min);
      else if (source === 'tile') next = moveTile(current, id, d.target, d.dir, min);
      else if (d.dir !== 'center') next = splitInto(current, d.target, id, d.dir, min);
      if (!next) {
        api.toast('공간이 부족하여 이 위치에 배치할 수 없습니다.', 'error');
        return false;
      }
      setTiles(next);
      return true;
    },
    [min],
  );

  // ESC: 위젯 추가 취소
  useEffect(() => {
    if (!placing) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && uiStore.set({ placing: null });
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [placing]);

  // 설치형: 독립창을 메인 창으로 끌어오기 (p19 드레그 인)
  useEffect(() => {
    if (!desktop) return;
    const offOver = desktop.widgets.onDragOver((p) => {
      if (!p) {
        setDrag((d) => (d?.source === 'external' ? null : d));
        setDrop(null);
        uiStore.set({ dragging: false });
        return;
      }
      const box = ref.current!.getBoundingClientRect();
      setDrag({ id: p.id, source: 'external', x: p.clientX - box.left, y: p.clientY - box.top, ox: 0, oy: 0, w: 0, h: 0, outside: false });
      setDrop(readDrop(p.clientX, p.clientY));
      uiStore.set({ dragging: true });
    });
    const offDrop = desktop.widgets.onDrop((p) => {
      const d = readDrop(p.clientX, p.clientY);
      if (d && !(d.kind === 'dock' && d.dir === 'center') && place(p.id, d, 'external')) desktop!.widgets.reattach(p.id);
      setDrag(null);
      setDrop(null);
      uiStore.set({ dragging: false });
    });
    return () => {
      offOver();
      offDrop();
    };
  }, [place]);

  /** 위젯 헤더 드래그 시작 (캔버스 안 위젯 이동 또는 추가 중인 위젯 배치) */
  const startDrag = (e: React.PointerEvent, id: WidgetId, source: 'tile' | 'placing') => {
    if (e.button !== 0) return;
    const box = ref.current!.getBoundingClientRect();
    const frame = (e.currentTarget as HTMLElement).closest('[data-frame]')!.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY };
    let active = false;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const move = (ev: PointerEvent) => {
      if (!active && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 5) return;
      active = true;
      uiStore.set({ dragging: true });
      const outside = ev.clientX < 0 || ev.clientY < 0 || ev.clientX > window.innerWidth || ev.clientY > window.innerHeight;
      setDrag({ id, source, x: ev.clientX - box.left, y: ev.clientY - box.top, ox: start.x - frame.left, oy: start.y - frame.top, w: frame.width, h: frame.height, outside });
      setDrop(outside ? null : readDrop(ev.clientX, ev.clientY));
    };
    const up = (ev: PointerEvent) => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
      uiStore.set({ dragging: false });
      setDrag(null);
      setDrop(null);
      if (!active) return;
      const outside = ev.clientX < 0 || ev.clientY < 0 || ev.clientX > window.innerWidth || ev.clientY > window.innerHeight;
      // 설치형: 캔버스 밖으로 끌어내면 독립창으로 분리 (p19 드레그 아웃). 후원 리스트는 분리 불가.
      if (outside && desktop && !isFixedWidget(id)) {
        const meta = WIDGETS[id];
        if (source === 'tile') setTiles(removeFrom(layoutStore.get().tiles, id));
        else uiStore.set({ placing: null });
        desktop.widgets.detach(id, {
          screenX: Math.round(ev.screenX - (start.x - frame.left)),
          screenY: Math.round(ev.screenY - (start.y - frame.top)),
          width: Math.round(frame.width),
          height: Math.round(frame.height),
          minWidth: meta.minWidth,
          minHeight: meta.minHeight,
          title: meta.title,
        });
        return;
      }
      const d = readDrop(ev.clientX, ev.clientY);
      if (!d) return;
      if (source === 'placing' && d.kind === 'dock' && d.dir === 'center') return;
      if (place(id, d, source) && source === 'placing') uiStore.set({ placing: null });
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  };

  /** 경계 리사이즈. 시작 시점 배치를 기준으로 누적 이동량을 적용해 오차가 쌓이지 않게 한다. */
  const startResize = (e: React.PointerEvent, id: WidgetId, edge: CanvasEdge) => {
    e.preventDefault();
    e.stopPropagation();
    const base = layoutStore.get().tiles;
    const sx = e.clientX;
    const sy = e.clientY;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const delta = edge === 'left' || edge === 'right' ? (ev.clientX - sx) / size.w : (ev.clientY - sy) / size.h;
      setTiles(resizeEdge(base, id, edge, delta, min));
    };
    const up = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
  };

  const showIndicators = !!drag || !!placing;
  const indicatorSource: Source | null = drag?.source ?? (placing ? 'placing' : null);
  const preview = drop ? previewRect(tiles, drop) : null;
  const px = (r: Rect) => ({
    left: r.x * size.w + GAP / 2,
    top: r.y * size.h + GAP / 2,
    width: Math.max(0, r.w * size.w - GAP),
    height: Math.max(0, r.h * size.h - GAP),
  });

  return (
    <div className="absolute inset-x-0 top-0" style={{ bottom: bottomInset }}>
      <div ref={ref} className="absolute inset-1.5">
        {(Object.entries(tiles) as [WidgetId, Rect][]).map(([id, r]) => {
          const Body = WIDGET_COMPONENTS[id];
          const edges = resizableEdges(r);
          const isDragged = drag?.id === id && drag.source === 'tile';
          return (
            <div key={id} data-frame className="absolute transition-[left,top,width,height] duration-200 ease-out" style={{ ...px(r), transitionDuration: drag || !size.w ? '0ms' : undefined }}>
              <WidgetFrame
                id={id}
                dimmed={isDragged}
                onHeaderPointerDown={(e) => startDrag(e, id, 'tile')}
                onClose={() => setTiles(removeFrom(layoutStore.get().tiles, id))}
              >
                <Body />
              </WidgetFrame>
              {!drag && (
                <>
                  {edges.top && <div className="absolute -top-1 inset-x-2 h-2 cursor-ns-resize z-10" onPointerDown={(e) => startResize(e, id, 'top')} />}
                  {edges.bottom && <div className="absolute -bottom-1 inset-x-2 h-2 cursor-ns-resize z-10" onPointerDown={(e) => startResize(e, id, 'bottom')} />}
                  {edges.left && <div className="absolute -left-1 inset-y-2 w-2 cursor-ew-resize z-10" onPointerDown={(e) => startResize(e, id, 'left')} />}
                  {edges.right && <div className="absolute -right-1 inset-y-2 w-2 cursor-ew-resize z-10" onPointerDown={(e) => startResize(e, id, 'right')} />}
                </>
              )}
              {showIndicators && !isDragged && (
                <DockIndicator target={id} active={drop?.kind === 'dock' && drop.target === id ? drop.dir : null} centerDisabled={indicatorSource !== 'tile'} />
              )}
            </div>
          );
        })}

        {preview && <div className="absolute pointer-events-none rounded-xl bg-blue-500/25 border-2 border-blue-500/70 z-30 transition-all duration-150" style={px(preview)} />}

        {showIndicators && <EdgeIndicators active={drop?.kind === 'edge' ? drop.edge : null} />}

        {/* 추가 중인 위젯: 중앙에 같은 크기로 떠 있고 크기 조절 불가, 그림자 효과 (p21 ①) */}
        {/* 드래그 중에도 언마운트하지 않는다: 헤더가 포인터 캡처를 쥐고 있어야 드롭(pointerup)을 받는다 */}
        {placing && (
          <div
            data-frame
            className={`absolute z-40 ${drag?.source === 'placing' ? 'opacity-0 pointer-events-none' : ''}`}
            style={{ left: (size.w - FLOAT_W) / 2, top: (size.h - FLOAT_H) / 2, width: FLOAT_W, height: FLOAT_H }}
          >
            <WidgetFrame id={placing} floating onHeaderPointerDown={(e) => startDrag(e, placing, 'placing')} onClose={() => uiStore.set({ placing: null })}>
              <FloatingBody id={placing} />
            </WidgetFrame>
          </div>
        )}

        {/* 드래그 중인 위젯: 반투명으로 포인터를 따라다닌다 */}
        {drag && drag.source !== 'external' && (
          <div className="absolute z-50 pointer-events-none opacity-60" style={{ left: drag.x - drag.ox, top: drag.y - drag.oy, width: drag.w, height: drag.h }}>
            <WidgetFrame id={drag.id} floating>
              <div className="h-full flex items-center justify-center text-xs text-slate-400">{drag.outside && desktop ? '놓으면 독립창으로 분리됩니다' : '원하는 위치의 인디케이터에 놓아 주세요'}</div>
            </WidgetFrame>
          </div>
        )}
      </div>
      {placing && !drag && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold shadow-xl pointer-events-none whitespace-nowrap">
          위젯 헤더를 끌어 도킹 인디케이터 위에 놓아 주세요 (ESC: 취소)
        </div>
      )}
    </div>
  );
}

const FloatingBody = ({ id }: { id: WidgetId }) => {
  const Body = WIDGET_COMPONENTS[id];
  return <Body />;
};

/** 후원 리스트는 캔버스에서 닫히지 않는다 (p38 ※). */
function removeFrom(tiles: Tiles, id: WidgetId): Tiles {
  return isFixedWidget(id) ? tiles : removeTile(tiles, id);
}

const DIRS: { dir: Exclude<DockDirection, 'center'>; Icon: typeof ChevronUp; cls: string }[] = [
  { dir: 'top', Icon: ChevronUp, cls: 'left-1/2 -translate-x-1/2 top-0' },
  { dir: 'bottom', Icon: ChevronDown, cls: 'left-1/2 -translate-x-1/2 bottom-0' },
  { dir: 'left', Icon: ChevronLeft, cls: 'top-1/2 -translate-y-1/2 left-0' },
  { dir: 'right', Icon: ChevronRight, cls: 'top-1/2 -translate-y-1/2 right-0' },
];

/** 도킹 인디케이터: 위젯 중앙의 5방향 버튼 (p11). 위젯 추가·드레그 인 때는 중앙(위치 교환) 비활성. */
function DockIndicator({ target, active, centerDisabled }: { target: WidgetId; active: DockDirection | null; centerDisabled: boolean }) {
  const btn = (on: boolean) => `absolute w-10 h-10 rounded-xl border-2 flex items-center justify-center shadow-lg transition-all ${on ? 'bg-blue-600 border-blue-400 text-white scale-110' : 'bg-white/95 dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-200'}`;
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
      <div className="relative w-[136px] h-[136px] pointer-events-auto">
        {DIRS.map(({ dir, Icon, cls }) => (
          <div key={dir} data-drop={JSON.stringify({ kind: 'dock', target, dir })} aria-label={`${dir} 분할`} className={`${btn(active === dir)} ${cls}`}>
            <Icon size={20} className="pointer-events-none" />
          </div>
        ))}
        <div
          data-drop={centerDisabled ? undefined : JSON.stringify({ kind: 'dock', target, dir: 'center' })}
          aria-label="위치 교환"
          className={`${btn(active === 'center')} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${centerDisabled ? 'opacity-30' : ''}`}
        >
          <ArrowLeftRight size={18} className="pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

/** 엣지 인디케이터: 캔버스 상하좌우 4곳 (p11) */
function EdgeIndicators({ active }: { active: CanvasEdge | null }) {
  const items: { edge: CanvasEdge; Icon: typeof PanelTop; cls: string }[] = [
    { edge: 'top', Icon: PanelTop, cls: 'top-2 left-1/2 -translate-x-1/2' },
    { edge: 'bottom', Icon: PanelBottom, cls: 'bottom-2 left-1/2 -translate-x-1/2' },
    { edge: 'left', Icon: PanelLeft, cls: 'left-2 top-1/2 -translate-y-1/2' },
    { edge: 'right', Icon: PanelRight, cls: 'right-2 top-1/2 -translate-y-1/2' },
  ];
  return (
    <>
      {items.map(({ edge, Icon, cls }) => (
        <div
          key={edge}
          data-drop={JSON.stringify({ kind: 'edge', edge })}
          aria-label={`캔버스 ${edge} 가장자리에 삽입`}
          className={`absolute z-40 w-11 h-11 rounded-xl border-2 flex items-center justify-center shadow-xl ${cls} ${active === edge ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white dark:bg-slate-700 border-blue-400 text-blue-600 dark:text-blue-300'}`}
        >
          <Icon size={20} className="pointer-events-none" />
        </div>
      ))}
    </>
  );
}
