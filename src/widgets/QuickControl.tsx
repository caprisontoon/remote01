import { Pause, Play, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { api } from '../state/app';
import { useData, useSettings, useSize } from '../lib/hooks';
import { useT } from '../lib/i18n';
import type { QuickKind } from '../types';
import { WidgetHeader } from '../shell/WidgetFrame';

const GROUPS: { kind: QuickKind; label: string; pause: string; skip: string }[] = [
  { kind: 'alert', label: '알림', pause: '알림 일시 정지', skip: '알림 스킵' },
  { kind: 'drawing', label: '그림', pause: '그림 일시 정지', skip: '그림 스킵' },
  { kind: 'draw', label: '뽑기', pause: '뽑기 일시 정지', skip: '뽑기 스킵' },
];

const GAP = 8; // gap-2
const ROW_W = 180; // 가로 한 줄 배치에서 묶음 하나가 "○○ 일시 정지 중" + 스킵을 잘리지 않게 담는 폭 (텍스트 100% 기준)
const TAB_FULL_W = 132; // 탭 배치에서 버튼 하나가 "○○ 일시 정지 중"을 담는 폭. 이보다 좁으면 "일시 정지 중"·"스킵"만 (탭이 종류를 알려 준다)

/** 가로 한 줄 묶음 (넓을 때): 일시 정지 + 스킵을 1px 테두리로 묶은 한 덩어리 */
function Bundle({ g, on }: { g: (typeof GROUPS)[number]; on: boolean }) {
  const t = useT();
  const hover = on ? 'hover:brightness-105' : 'hover:bg-surface-sunken';
  return (
    <div
      className={`flex h-full min-h-[44px] max-h-[96px] self-center min-w-0 rounded-control border overflow-hidden transition-colors ${
        on ? 'bg-warning border-warning text-text-on-warning' : 'bg-surface-raised border-line-strong text-text'
      }`}
    >
      <button onClick={() => api.togglePause(g.kind)} aria-pressed={on} className={`flex-1 min-w-0 px-2 flex items-center justify-center gap-1.5 text-body font-semibold ${hover}`}>
        {on ? <Play size={14} className="shrink-0" /> : <Pause size={14} className="shrink-0" />}
        <span className="truncate">{on ? `${t(g.pause)} 중` : t(g.pause)}</span>
      </button>
      {/* 묶음이 overflow-hidden이라 툴팁은 브라우저 기본(title)을 쓴다 */}
      <button
        onClick={() => api.skip(g.kind)}
        aria-label={t(g.skip)}
        title={t(g.skip)}
        className={`w-12 shrink-0 flex items-center justify-center border-l ${on ? 'border-text-on-warning/20' : 'border-line-strong'} ${hover}`}
      >
        <SkipForward size={15} />
      </button>
    </div>
  );
}

/**
 * 퀵 제어 (p61). 위젯 칸 크기에 따라 두 가지로 보인다.
 * - 넓을 때: 알림·그림·뽑기 세 묶음을 가로 한 줄로 — 세 가지 상태가 한눈에 보인다.
 * - 좁거나 낮을 때: 기획서처럼 제목줄에 탭 [알림 / 그림 / 뽑기], 본문에 큰 버튼 두 개 [일시 정지] [스킵].
 *   다른 탭이 일시 정지 중이면 탭에 주황 점을 붙여 가려진 상태를 알린다. 처음에는 일시 정지된 탭을 연다.
 * 일시 정지 중에는 warning 바탕 + "○○ 일시 정지 중" (그동안 통합 알림창에 노출되지 않는다).
 */
export default function QuickControl({ only }: { only?: QuickKind[] }) {
  const t = useT();
  const paused = useData((d) => d.paused);
  const scale = useSettings((s) => s.textScale) / 100;
  const [ref, size] = useSize<HTMLDivElement>();
  const groups = only ? GROUPS.filter((g) => only.includes(g.kind)) : GROUPS;
  const [tab, setTab] = useState<QuickKind>(() => groups.find((g) => paused[g.kind])?.kind ?? groups[0].kind);

  const n = groups.length;
  // 바깥 div에는 여백이 없어 버튼 영역 여백(p-2.5 = 0.625rem, 양쪽)을 빼서 계산한다
  const w = size.w - 2 * 10 * scale;
  const row = size.w === 0 || (w - (n - 1) * GAP) / n >= ROW_W * scale;
  const current = groups.find((g) => g.kind === tab) ?? groups[0];
  const on = paused[current.kind];
  const fullLabels = (w - GAP) / 2 >= TAB_FULL_W * scale;
  const pauseText = fullLabels ? t(current.pause) : '일시 정지';
  const skipText = fullLabels ? t(current.skip) : '스킵';

  return (
    // 탭은 위젯 제목줄로 올라간다. 위젯 틀이 없는 모바일에서는 버튼 위에 한 줄로 그려지도록 버튼 영역과 분리한다
    <div ref={ref} className="h-full flex flex-col overflow-hidden">
      {row ? (
        <div className="flex-1 min-h-0 grid grid-flow-col auto-cols-fr gap-2 p-2.5">
          {groups.map((g) => <Bundle key={g.kind} g={g} on={paused[g.kind]} />)}
        </div>
      ) : (
        <>
          {n > 1 && (
            <WidgetHeader>
              <div role="tablist" aria-label="퀵 제어 종류" className="flex items-stretch min-w-0 overflow-x-auto [scrollbar-width:none]">
                {groups.map((g) => (
                  <button
                    key={g.kind}
                    role="tab"
                    aria-selected={tab === g.kind}
                    onClick={() => setTab(g.kind)}
                    className={`relative px-[8px] shrink-0 flex items-center gap-1 whitespace-nowrap text-body border-b-2 -mb-px transition-colors ${
                      tab === g.kind ? 'border-live text-text font-semibold' : 'border-transparent text-text-secondary hover:text-text'
                    }`}
                  >
                    {t(g.label)}
                    {/* 일시 정지 중인 종류는 탭에 주황 점 — 다른 탭을 보고 있어도 알 수 있게 */}
                    {paused[g.kind] && <span aria-label="일시 정지 중" className="w-1.5 h-1.5 rounded-pill bg-warning" />}
                  </button>
                ))}
              </div>
            </WidgetHeader>
          )}
          <div className="flex-1 min-h-0 grid grid-cols-2 gap-2 p-2.5">
            <button
              onClick={() => api.togglePause(current.kind)}
              aria-pressed={on}
              aria-label={on ? `${t(current.pause)} 중` : t(current.pause)}
              className={`h-full min-h-[44px] max-h-[96px] self-center min-w-0 px-2 rounded-control border flex items-center justify-center gap-1.5 text-body font-semibold transition-colors ${
                on ? 'bg-warning border-warning text-text-on-warning hover:brightness-105' : 'bg-surface-raised border-line-strong text-text hover:bg-surface-sunken'
              }`}
            >
              {on ? <Play size={15} className="shrink-0" /> : <Pause size={15} className="shrink-0" />}
              <span className="truncate">{on ? `${pauseText} 중` : pauseText}</span>
            </button>
            <button
              onClick={() => api.skip(current.kind)}
              aria-label={t(current.skip)}
              className="h-full min-h-[44px] max-h-[96px] self-center min-w-0 px-2 rounded-control border bg-surface-raised border-line-strong text-text hover:bg-surface-sunken flex items-center justify-center gap-1.5 text-body font-semibold"
            >
              <SkipForward size={15} className="shrink-0" />
              <span className="truncate">{skipText}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
