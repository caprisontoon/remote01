import { HelpCircle, Play, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { api } from '../state/app';
import { useData, useSettings, useWidth } from '../lib/hooks';
import type { ToneAd as Ad } from '../types';
import { Badge, Button, Cash, Empty, Modal, Toggle, Tooltip } from '../components/ui';

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
  const scale = useSettings((s) => s.textScale) / 100;
  const compact = width > 0 && width < 460 * scale;
  const pendingCount = ads.filter((a) => !a.playedAt).length;
  const sorted = [...ads].sort((a, b) => Number(!!a.playedAt) - Number(!!b.playedAt));

  return (
    <div ref={ref} className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 px-[14px] h-10 shrink-0 border-b border-line text-body">
        <span className="flex items-center gap-1.5 font-semibold text-text whitespace-nowrap">미집행 광고 <Badge count={pendingCount} /></span>
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-text truncate">광고 자동 재생</span>
          <Tooltip label="광고비 지원 캐시조건 · 수수료 포함 캐시 금액 · 정상 PLAY 완료 시 지급" side="bottom">
            <HelpCircle size={13} className="text-text-tertiary" />
          </Tooltip>
          <Toggle size="sm" on={autoPlay} onChange={api.setAdAutoPlay} label="광고 자동 재생" />
        </span>
      </div>
      {ads.length === 0 ? (
        <Empty>집행할 광고가 없습니다.</Empty>
      ) : compact ? (
        <ul className="flex-1 overflow-auto">
          {sorted.map((a) => (
            <li key={a.id} className={`border-b border-line-subtle ${a.playedAt ? 'text-text-tertiary' : 'text-text-body'}`}>
              <button className="w-full flex items-center gap-2 px-[14px] py-2.5 text-left hover:bg-surface-sunken" onClick={() => setOpen((v) => (v === a.id ? null : a.id))}>
                <img src={a.thumbnail} alt="" className="w-14 aspect-video rounded-tag object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-caption text-text-secondary truncate">{a.advertiser}</div>
                  <div className={`font-semibold truncate ${a.playedAt ? '' : 'text-text'}`}>{a.title}</div>
                </div>
                <div className="text-right shrink-0">
                  <Cash value={a.cash} className={a.playedAt ? '' : 'text-text'} />
                  <div className="text-caption text-text-tertiary">{a.playedAt ? '완료' : mmss(a.durationSec)}</div>
                </div>
              </button>
              {open === a.id && !a.playedAt && (
                <div className="px-[14px] pb-2.5 flex gap-1.5">
                  <Button size="sm" onClick={() => api.playAd(a.id)}>▶ 재생</Button>
                  <Button variant="outline" size="sm" onClick={() => api.skipAd(a.id)}>SKIP</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed border-collapse text-body">
            <thead className="sticky top-0 bg-surface-sunken text-caption text-text-secondary">
              <tr>
                <th className="w-[120px] h-8 pl-[14px] pr-2 text-left font-medium">광고주 명</th>
                <th className="w-[88px] h-8 px-2 text-right font-medium">후원 캐시</th>
                <th className="h-8 px-2 text-left font-medium">내용</th>
                <th className="w-[96px] h-8 pl-2 pr-[14px] text-right font-medium">재생 시간</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id} onClick={() => setDetail(a)} className={`group h-[46px] cursor-pointer border-b border-line-subtle hover:bg-surface-sunken ${a.playedAt ? 'text-text-tertiary' : 'text-text-body'}`}>
                  <td className={`pl-[14px] pr-2 truncate font-semibold ${a.playedAt ? '' : 'text-text'}`}>{a.advertiser}</td>
                  <td className={`px-2 text-right ${a.playedAt ? '' : 'text-text'}`}><Cash value={a.cash} /></td>
                  <td className="px-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={a.thumbnail} alt="" className="w-12 aspect-video rounded-tag object-cover shrink-0" />
                      <span className="truncate">{a.title}</span>
                    </div>
                  </td>
                  <td className="pl-1 pr-[14px] text-right text-caption">
                    {a.playedAt ? (
                      '완료'
                    ) : (
                      <>
                        <span className="group-hover:hidden font-num text-text-tertiary">{mmss(a.durationSec)}</span>
                        <span className="hidden group-hover:inline-flex gap-1">
                          <Tooltip label="재생"><button aria-label="재생" onClick={(e) => { e.stopPropagation(); api.playAd(a.id); }} className="w-7 h-7 rounded-control bg-brand text-text-on-brand hover:bg-brand-hover flex items-center justify-center"><Play size={12} /></button></Tooltip>
                          <Tooltip label="SKIP"><button aria-label="SKIP" onClick={(e) => { e.stopPropagation(); api.skipAd(a.id); }} className="w-7 h-7 rounded-control bg-surface-raised border border-line-strong text-text flex items-center justify-center"><SkipForward size={12} /></button></Tooltip>
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
          <div className="p-5 space-y-3 text-body">
            <img src={detail.thumbnail} alt="" className="w-full aspect-video rounded-card object-cover" />
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-text-body">
              <dt className="text-text-secondary whitespace-nowrap">타이틀</dt><dd className="font-semibold text-text">{detail.title}</dd>
              <dt className="text-text-secondary whitespace-nowrap">재생 시간</dt><dd className="tabular-nums">{detail.playedAt ? stamp(detail.playedAt) : mmss(detail.durationSec)}</dd>
              <dt className="text-text-secondary whitespace-nowrap">캐시</dt><dd><Cash value={detail.cash} /> 캐시 (수수료 포함)</dd>
            </dl>
            {!detail.playedAt && (
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => { api.playAd(detail.id); setDetail(null); }}>▶ 재생</Button>
                <Button variant="outline" onClick={() => { api.skipAd(detail.id); setDetail(null); }}>SKIP</Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
