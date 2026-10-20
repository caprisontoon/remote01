import { Pause, Play, SkipForward } from 'lucide-react';
import { api } from '../state/app';
import { useData, useSettings, useSize } from '../lib/hooks';
import { useT } from '../lib/i18n';
import type { QuickKind } from '../types';

const GROUPS: { kind: QuickKind; label: string; pause: string; skip: string }[] = [
  { kind: 'alert', label: '알림', pause: '알림 일시 정지', skip: '알림 스킵' },
  { kind: 'drawing', label: '그림', pause: '그림 일시 정지', skip: '그림 스킵' },
  { kind: 'draw', label: '뽑기', pause: '뽑기 일시 정지', skip: '뽑기 스킵' },
];

const GAP = 8; // gap-2
const MIN_H = 44; // h-control(퀵 제어) — 버튼 묶음 최소 높이
const FULL_W = 180; // "○○ 일시 정지 중" 라벨 + 스킵 버튼이 잘리지 않는 묶음 폭 (텍스트 100% 기준)
const SPLIT_W = 56; // 세로 묶음에서 아이콘 + 두 글자 라벨이 들어가는 폭 (텍스트 100% 기준)
const SPLIT_H = 48; // 세로 묶음(일시 정지 위 / 스킵 아래) 최소 높이 — 위 28px · 아래 20px

type Layout = 'row' | 'stack' | 'split' | 'icon';

/**
 * 위젯 칸 크기에 맞춰 배치를 고른다. 어느 배치에서도 묶음이 겹치거나 라벨이 한 글자로 잘리지 않게 한다.
 * - row: 넓으면 세 묶음을 가로 한 줄로 (전체 라벨)
 * - stack: 좁지만 세로로 세 줄이 들어가면 세로로 (전체 라벨)
 * - split: 좁고 낮으면 가로 세 칸, 각 칸은 위 일시 정지(아이콘 + "알림") / 아래 스킵
 * - icon: 그마저 안 들어가면 아이콘만 (이름은 툴팁·스크린리더로)
 */
function pickLayout(w: number, h: number, n: number, scale: number): Layout {
  if (w === 0) return 'row';
  // w·h는 ResizeObserver contentRect(안쪽 여백 p-2.5를 뺀 크기)라 간격만 뺀다
  const inner = (span: number, count: number) => (span - (count - 1) * GAP) / count;
  if (inner(w, n) >= FULL_W * scale) return 'row';
  if (inner(h, n) >= MIN_H) return 'stack';
  if (inner(w, n) >= SPLIT_W * scale && h >= SPLIT_H) return 'split';
  return 'icon';
}

/**
 * 퀵 제어 (p61). 일시 정지 버튼과 스킵 버튼을 1px 테두리로 묶은 한 덩어리.
 * 일시 정지 중에는 묶음 전체가 warning 바탕 + "○○ 일시 정지 중" (그동안 통합 알림창에 노출되지 않는다).
 */
export default function QuickControl({ only }: { only?: QuickKind[] }) {
  const t = useT();
  const paused = useData((d) => d.paused);
  const scale = useSettings((s) => s.textScale) / 100;
  const [ref, size] = useSize<HTMLDivElement>();
  const groups = only ? GROUPS.filter((g) => only.includes(g.kind)) : GROUPS;
  const layout = pickLayout(size.w, size.h, groups.length, scale);
  const split = layout === 'split';
  const iconOnly = layout === 'icon';
  // 묶음은 칸 높이를 채운다 (가로 묶음은 최소 44px·최대 96px)
  return (
    <div
      ref={ref}
      className={`h-full grid gap-2 p-2.5 overflow-hidden ${layout === 'stack' ? 'grid-cols-1 auto-rows-fr' : 'grid-flow-col auto-cols-fr'}`}
    >
      {groups.map((g) => {
        const on = paused[g.kind];
        const pauseLabel = on ? `${t(g.pause)} 중` : t(g.pause);
        const short = layout === 'row' || layout === 'stack' ? pauseLabel : t(g.label);
        const tone = on ? 'bg-warning border-warning text-text-on-warning' : 'bg-surface-raised border-line-strong text-text';
        const hover = on ? 'hover:brightness-105' : 'hover:bg-surface-sunken';
        const divider = on ? 'border-text-on-warning/20' : 'border-line-strong';
        return (
          // 묶음이 overflow-hidden이라 툴팁은 브라우저 기본(title)을 쓴다
          <div
            key={g.kind}
            className={`flex ${split ? 'flex-col h-full' : 'h-full min-h-[44px] max-h-[96px] self-center'} min-w-0 rounded-control border overflow-hidden transition-colors ${tone}`}
          >
            <button
              onClick={() => api.togglePause(g.kind)}
              aria-pressed={on}
              aria-label={pauseLabel}
              title={short === pauseLabel ? undefined : pauseLabel}
              className={`flex-1 min-w-0 min-h-0 flex items-center justify-center gap-1.5 font-semibold ${split ? 'px-1 text-caption' : 'px-2 text-body'} ${hover}`}
            >
              {on ? <Play size={14} className="shrink-0" /> : <Pause size={14} className="shrink-0" />}
              {!iconOnly && <span className="truncate">{short}</span>}
            </button>
            <button
              onClick={() => api.skip(g.kind)}
              aria-label={t(g.skip)}
              title={t(g.skip)}
              className={`shrink-0 flex items-center justify-center ${split ? 'h-[42%] min-h-[20px] border-t' : `${iconOnly ? 'w-8' : 'w-12'} border-l`} ${divider} ${hover}`}
            >
              <SkipForward size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
