import { Pause, Play, SkipForward } from 'lucide-react';
import { api } from '../state/app';
import { useData, useWidth } from '../lib/hooks';
import { useT } from '../lib/i18n';
import type { QuickKind } from '../types';

const GROUPS: { kind: QuickKind; label: string; pause: string; skip: string }[] = [
  { kind: 'alert', label: '알림', pause: '알림 일시 정지', skip: '알림 스킵' },
  { kind: 'drawing', label: '그림', pause: '그림 일시 정지', skip: '그림 스킵' },
  { kind: 'draw', label: '뽑기', pause: '뽑기 일시 정지', skip: '뽑기 스킵' },
];

/** 퀵 제어 (p61). 일시 정지가 켜지면 붉게 바뀌고, 그동안 통합 알림창에 노출되지 않는다. 버튼 크기는 위젯 크기에 맞춰 바뀐다. */
export default function QuickControl({ only }: { only?: QuickKind[] }) {
  const t = useT();
  const paused = useData((d) => d.paused);
  const [ref, width] = useWidth<HTMLDivElement>();
  const wide = width > 520;
  const groups = only ? GROUPS.filter((g) => only.includes(g.kind)) : GROUPS;
  return (
    <div ref={ref} className={`h-full grid gap-2 p-2 ${wide ? 'grid-cols-3' : 'grid-cols-1'}`}>
      {groups.map((g) => (
        <div key={g.kind} className="flex flex-col min-h-0">
          {!wide && groups.length > 1 && <div className="text-[10px] font-bold text-slate-400 mb-1">{g.label}</div>}
          <div className="flex-1 grid grid-cols-2 gap-2 min-h-[40px]">
            <button
              onClick={() => api.togglePause(g.kind)}
              aria-pressed={paused[g.kind]}
              className={`rounded-[20px] font-medium text-[13px] flex items-center justify-center gap-1.5 transition-colors ${paused[g.kind] ? 'bg-red-500 text-white shadow-[0_6px_20px_rgba(255,56,60,0.35)]' : 'bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/85'}`}
            >
              {paused[g.kind] ? <Play size={16} /> : <Pause size={16} />}
              {t(g.pause)}
            </button>
            <button onClick={() => api.skip(g.kind)} className="rounded-[20px] font-medium text-[13px] flex items-center justify-center gap-1.5 bg-[rgba(120,120,128,0.16)] text-black hover:bg-[rgba(120,120,128,0.24)] dark:bg-[rgba(120,120,128,0.32)] dark:text-white">
              <SkipForward size={16} />
              {t(g.skip)}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
