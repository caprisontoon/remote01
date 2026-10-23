// 관리자 웹 차트. 한 가지 값만 보여 주므로 색은 live 하나(라이트 #006AF5 / 다크 #519CFF)만 쓴다.
// 글자는 텍스트 토큰, 막대는 4px 둥근 끝 + 바닥은 각지게, 눈금선은 1px 실선.
import { useEffect, useRef, useState } from 'react';
import { num, pct } from './ui';

function useWidthOf<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** 눈금 최댓값: 1·2·2.5·5·10 단위로 올림 */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : String(n));
const md = (date: string) => date.slice(5).replace('-', '.');

/** 날짜별 세로 막대 (일간 이용자). 막대 위에 올리면 날짜·값이 뜨고, 가장 큰 값만 직접 표시한다. */
export function ColumnChart({ data, unit = '명', height = 220 }: { data: { date: string; users: number }[]; unit?: string; height?: number }) {
  const [ref, width] = useWidthOf<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 40;
  const padR = 8;
  const padT = 22;
  const padB = 26;
  const plotW = Math.max(0, width - padL - padR);
  const plotH = height - padT - padB;
  const max = niceMax(Math.max(...data.map((d) => d.users)));
  const ticks = [0, max / 2, max];
  const slot = data.length ? plotW / data.length : 0;
  const barW = Math.max(1, Math.min(24, slot - 2));
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const peak = data.reduce((best, d, i) => (d.users > data[best].users ? i : best), 0);
  const labelIdx = [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`일간 이용자 ${data.length}일, 최대 ${num(data[peak]?.users ?? 0)}${unit}`} onPointerLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={width - padR} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" strokeWidth={1} />
              <text x={padL - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-text-tertiary font-num" fontSize={11}>
                {compact(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = padL + i * slot + (slot - barW) / 2;
            const top = y(d.users);
            const h = padT + plotH - top;
            const r = Math.min(4, barW / 2, h);
            return (
              <g key={d.date} onPointerEnter={() => setHover(i)}>
                {/* 막대보다 넓은 투명 영역이 마우스를 받는다 */}
                <rect x={padL + i * slot} y={padT} width={slot} height={plotH} fill="transparent" />
                <path
                  d={`M${x},${padT + plotH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${padT + plotH} Z`}
                  fill="rgb(var(--live))"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              </g>
            );
          })}
          {data[peak] && (
            <text x={padL + peak * slot + slot / 2} y={y(data[peak].users) - 6} textAnchor="middle" className="fill-text font-num" fontSize={11} fontWeight={600}>
              {num(data[peak].users)}
            </text>
          )}
          {labelIdx.map((i) =>
            data[i] ? (
              <text key={i} x={padL + i * slot + slot / 2} y={height - 8} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} className="fill-text-tertiary font-num" fontSize={11}>
                {md(data[i].date)}
              </text>
            ) : null,
          )}
        </svg>
      )}
      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute z-popover -translate-x-1/2 -translate-y-full rounded-control bg-surface-raised border border-line-strong shadow-float px-2.5 py-1.5 whitespace-nowrap"
          style={{ left: Math.min(Math.max(padL + hover * slot + slot / 2, 60), width - 60), top: Math.max(y(data[hover].users) - 8, 44) }}
        >
          <p className="text-body font-bold font-num tabular-nums">
            {num(data[hover].users)}
            <span className="ml-0.5 text-caption font-normal text-text-secondary">{unit}</span>
          </p>
          <p className="text-micro text-text-secondary font-num">{data[hover].date}</p>
        </div>
      )}
    </div>
  );
}

/** 항목별 가로 막대. 값과 비율은 글자로 함께 쓴다. */
export function BarList({ rows, total }: { rows: { label: string; value: number; sub?: string }[]; total?: number }) {
  const sum = total ?? rows.reduce((s, r) => s + r.value, 0);
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(72px,auto)_1fr_auto] items-center gap-3" title={`${r.label}: ${num(r.value)}명 (${pct(r.value, sum)})`}>
          <span className="text-body text-text truncate">
            {r.label}
            {r.sub && <span className="ml-1 text-caption text-text-tertiary">{r.sub}</span>}
          </span>
          <span className="h-2.5 rounded-r-[4px] bg-surface-sunken overflow-hidden">
            <span className="block h-full rounded-r-[4px] bg-live" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="text-body font-num tabular-nums text-right min-w-[110px]">
            <span className="font-semibold">{num(r.value)}</span>
            <span className="ml-1.5 text-caption text-text-secondary">{pct(r.value, sum)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
