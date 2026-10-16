import { HelpCircle, Play, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { api } from '../state/app';
import { formatCash } from '../lib/donation';
import { useData, useWidth } from '../lib/hooks';
import type { ToneAd as Ad } from '../types';
import { Badge, Button, Empty, Modal, Toggle, Tooltip } from '../components/ui';

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const stamp = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}:${p(d.getMonth() + 1)}:${p(d.getDate())} ${d.getHours()}:${p(d.getMinutes())}`;
};

/** 투네애드 (p81~84). 집행하지 않은 광고 수를 배지로, 집행 완료된 행은 회색으로. */
export default function ToneAd() {
  const ads = useData((d) => d.ads);
  const autoPlay = useData((d) => d.adAutoPlay);
  const [detail, setDetail] = useState<Ad | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [ref, width] = useWidth<HTMLDivElement>();
  const compact = width > 0 && width < 460;
  const pendingCount = ads.filter((a) => !a.playedAt).length;
  const sorted = [...ads].sort((a, b) => Number(!!a.playedAt) - Number(!!b.playedAt));

  return (
    <div ref={ref} className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 h-9 shrink-0 border-b border-black/[0.08] dark:border-white/10 text-xs">
        <span className="flex items-center gap-1.5 font-bold">미집행 광고 <Badge count={pendingCount} /></span>
        <span className="flex items-center gap-1.5">
          <span className="font-semibold">광고 자동 재생</span>
          <Tooltip label="광고비 지원 캐시조건 · 수수료 포함 캐시 금액 · 정상 PLAY 완료 시 지급" side="bottom">
            <HelpCircle size={13} className="text-slate-400" />
          </Tooltip>
          <Toggle size="sm" on={autoPlay} onChange={api.setAdAutoPlay} label="광고 자동 재생" />
        </span>
      </div>
      {ads.length === 0 ? (
        <Empty>집행할 광고가 없습니다.</Empty>
      ) : compact ? (
        <ul className="flex-1 overflow-auto divide-y divide-black/[0.08] dark:divide-white/10">
          {sorted.map((a) => (
            <li key={a.id} className={a.playedAt ? 'bg-slate-100 text-slate-400 dark:bg-white/[0.03]' : ''}>
              <button className="w-full flex items-center gap-2 p-2.5 text-left" onClick={() => setOpen((v) => (v === a.id ? null : a.id))}>
                <img src={a.thumbnail} alt="" className="w-14 aspect-video rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-500 truncate">{a.advertiser}</div>
                  <div className="text-xs font-bold truncate">{a.title}</div>
                </div>
                <div className="text-right text-[11px] shrink-0">
                  <div className="font-black">{formatCash(a.cash)}</div>
                  <div className="text-slate-400">{a.playedAt ? '완료' : mmss(a.durationSec)}</div>
                </div>
              </button>
              {open === a.id && !a.playedAt && (
                <div className="px-2.5 pb-2.5 flex gap-1.5">
                  <Button className="h-8" onClick={() => api.playAd(a.id)}>▶ 재생</Button>
                  <Button variant="ghost" className="h-8" onClick={() => api.skipAd(a.id)}>SKIP</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed border-collapse text-[11px]">
            <thead className="sticky top-0 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur text-black/50 dark:text-white/55">
              <tr>
                <th className="w-[110px] py-2 px-2 text-left">광고주 명</th>
                <th className="w-[72px] py-2 px-2 text-center">후원 캐시</th>
                <th className="py-2 px-2 text-left">내용</th>
                <th className="w-[84px] py-2 px-2 text-center">재생 시간</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id} onClick={() => setDetail(a)} className={`group cursor-pointer border-b border-black/[0.08] dark:border-white/10 transition-all hover:shadow-[0_4px_14px_rgba(15,23,42,0.12)] hover:-translate-y-px ${a.playedAt ? 'bg-slate-100 text-slate-400 dark:bg-white/[0.03]' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                  <td className="py-2 px-2 truncate font-semibold">{a.advertiser}</td>
                  <td className="py-2 px-2 text-center font-black tabular-nums">{formatCash(a.cash)}</td>
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={a.thumbnail} alt="" className="w-12 aspect-video rounded object-cover shrink-0" />
                      <span className="truncate">{a.title}</span>
                    </div>
                  </td>
                  <td className="py-1 px-1 text-center">
                    {a.playedAt ? (
                      '완료'
                    ) : (
                      <>
                        <span className="group-hover:hidden tabular-nums">{mmss(a.durationSec)}</span>
                        <span className="hidden group-hover:inline-flex gap-1">
                          <Tooltip label="재생"><button aria-label="재생" onClick={(e) => { e.stopPropagation(); api.playAd(a.id); }} className="w-7 h-7 rounded-md bg-blue-500 text-white flex items-center justify-center"><Play size={12} /></button></Tooltip>
                          <Tooltip label="SKIP"><button aria-label="SKIP" onClick={(e) => { e.stopPropagation(); api.skipAd(a.id); }} className="w-7 h-7 rounded-md bg-slate-700 text-white flex items-center justify-center"><SkipForward size={12} /></button></Tooltip>
                        </span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {detail && (
        <Modal title="광고 자세히 보기" onClose={() => setDetail(null)}>
          <div className="p-5 space-y-3 text-xs">
            <img src={detail.thumbnail} alt="" className="w-full aspect-video rounded-lg object-cover" />
            <dl className="grid grid-cols-[64px_1fr] gap-y-1.5">
              <dt className="text-slate-500">타이틀</dt><dd className="font-bold">{detail.title}</dd>
              <dt className="text-slate-500">재생 시간</dt><dd className="tabular-nums">{detail.playedAt ? stamp(detail.playedAt) : mmss(detail.durationSec)}</dd>
              <dt className="text-slate-500">캐시</dt><dd>{formatCash(detail.cash)} 캐시 (수수료 포함)</dd>
            </dl>
            {!detail.playedAt && (
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => { api.playAd(detail.id); setDetail(null); }}>▶ 재생</Button>
                <Button variant="ghost" onClick={() => { api.skipAd(detail.id); setDetail(null); }}>SKIP</Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
