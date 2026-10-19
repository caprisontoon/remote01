import { Pause, Play, SkipForward } from 'lucide-react';
import { api } from '../state/app';
import { useData, useWidth } from '../lib/hooks';
import { useT } from '../lib/i18n';
import type { QuickKind } from '../types';
import { Tooltip } from '../components/ui';

const GROUPS: { kind: QuickKind; label: string; pause: string; skip: string }[] = [
  { kind: 'alert', label: '알림', pause: '알림 일시 정지', skip: '알림 스킵' },
  { kind: 'drawing', label: '그림', pause: '그림 일시 정지', skip: '그림 스킵' },
  { kind: 'draw', label: '뽑기', pause: '뽑기 일시 정지', skip: '뽑기 스킵' },
];

/**
 * 퀵 제어 (p61). 일시 정지 버튼과 스킵 버튼을 1px 테두리로 묶은 한 덩어리.
 * 일시 정지 중에는 묶음 전체가 warning 바탕 + "○○ 일시 정지 중" (그동안 통합 알림창에 노출되지 않는다).
 */
export default function QuickControl({ only }: { only?: QuickKind[] }) {
  const t = useT();
  const paused = useData((d) => d.paused);
  const [ref, width] = useWidth<HTMLDivElement>();
  const wide = width > 520;
  const groups = only ? GROUPS.filter((g) => only.includes(g.kind)) : GROUPS;
  return (
    <div ref={ref} className={`h-full grid gap-2 p-2.5 content-start ${wide ? 'grid-cols-3' : 'grid-cols-1'}`}>
      {groups.map((g) => {
        const on = paused[g.kind];
        return (
          <div
            key={g.kind}
            className={`flex h-11 min-w-0 rounded-control border overflow-hidden transition-colors ${
              on ? 'bg-warning border-warning text-text-on-warning' : 'bg-surface-raised border-line-strong text-text'
            }`}
          >
            <button
              onClick={() => api.togglePause(g.kind)}
              aria-pressed={on}
              className={`flex-1 min-w-0 px-2 flex items-center justify-center gap-1.5 text-body font-semibold ${on ? 'hover:brightness-105' : 'hover:bg-surface-sunken'}`}
            >
              {on ? <Play size={14} className="shrink-0" /> : <Pause size={14} className="shrink-0" />}
              <span className="truncate">{on ? `${t(g.pause)} 중` : t(g.pause)}</span>
            </button>
            <Tooltip label={t(g.skip)}>
              <button
                onClick={() => api.skip(g.kind)}
                aria-label={t(g.skip)}
                className={`w-12 h-full flex items-center justify-center border-l ${on ? 'border-text-on-warning/20 hover:brightness-105' : 'border-line-strong hover:bg-surface-sunken'}`}
              >
                <SkipForward size={15} />
              </button>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
}
