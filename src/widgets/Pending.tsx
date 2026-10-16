import { ArrowLeft, ExternalLink, Play as PlayIcon, Timer } from 'lucide-react';
import { useState } from 'react';
import { api } from '../state/app';
import { formatCash } from '../lib/donation';
import { mmss, useData, useNow } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { openUrl } from '../platform';
import type { PendingItem } from '../types';
import { Badge, Button, Empty } from '../components/ui';

const KIND = {
  quest: { label: '퀘스트', color: 'bg-blue-600' },
  luckybox: { label: '럭키박스', color: 'bg-violet-600' },
  play: { label: '플레이', color: 'bg-lime-600' },
  video: { label: '영상', color: 'bg-red-500' },
} as const;

/** 대기 중인 후원 (p62~67). 수락·미션 수행 전인 후원 수를 배지로 보여준다. */
export default function Pending() {
  const pending = useData((d) => d.pending);
  const now = useNow();
  const [detail, setDetail] = useState<string | null>(null);
  const current = pending.find((p) => p.id === detail);

  if (current?.kind === 'play' && current.challenging) return <PlayQuestion p={current} now={now} onBack={() => setDetail(null)} />;
  if (current?.kind === 'video') return <VideoPreview p={current} onBack={() => setDetail(null)} />;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 h-9 shrink-0 text-xs font-bold border-b border-black/[0.08] dark:border-white/10">
        대기 중인 후원 <Badge count={pending.length} />
      </div>
      {pending.length === 0 ? (
        <Empty>대기 중인 후원이 없습니다.</Empty>
      ) : (
        <ul className="flex-1 overflow-auto p-2 space-y-2">
          {pending.map((p) => (
            <Card key={p.id} p={p} now={now} onOpen={() => setDetail(p.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Card({ p, now, onOpen }: { p: PendingItem; now: number; onOpen: () => void }) {
  const t = useT();
  const remain = p.deadline - now;
  const urgent = remain < 15_000;
  const cashLabel = p.kind === 'video' ? '후원캐시' : '성공캐시';
  return (
    <li className="rounded-2xl bg-[rgba(116,116,128,0.08)] dark:bg-[rgba(118,118,128,0.18)] overflow-hidden">
      <div className="grid grid-cols-2 text-[11px]">
        <div className={`${KIND[p.kind].color} text-white font-bold flex items-center justify-center h-8`}>{KIND[p.kind].label}</div>
        <div className="flex flex-col justify-center px-2 h-8 min-w-0 border-b border-black/[0.08] dark:border-white/10">
          <span className="font-bold truncate">{p.nickname}</span>
        </div>
        <div className="px-2 h-7 flex items-center border-r border-black/[0.08] dark:border-white/10">
          [{cashLabel}] <b className="ml-1">{formatCash(p.cash)}</b>
        </div>
        <div className={`px-2 h-7 flex items-center gap-1 tabular-nums ${urgent ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
          <Timer size={12} /> {p.kind === 'play' && p.challenging ? '남은 시간' : '[남은 시간]'} {mmss(remain)}
        </div>
      </div>
      {p.kind === 'quest' && <div className="px-3 py-2 text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-500/10">{p.title}</div>}
      <div className="p-2 grid grid-cols-2 gap-1.5">
        {p.kind === 'quest' && !p.accepted && (
          <>
            <Button onClick={() => api.acceptPending(p.id)}>{t('수락')}</Button>
            <Button variant="ghost" onClick={() => api.rejectPending(p.id)}>{t('거절')}</Button>
          </>
        )}
        {p.kind === 'quest' && p.accepted && (
          <>
            <Button onClick={() => api.resolveQuest(p.id, true)}>{t('성공')}</Button>
            <Button variant="danger" onClick={() => api.resolveQuest(p.id, false)}>{t('실패')}</Button>
          </>
        )}
        {p.kind === 'luckybox' && <LuckyBoxPicker p={p} />}
        {p.kind === 'play' && (
          <Button className="col-span-2" variant={p.challenging ? 'dark' : 'primary'} onClick={() => { if (!p.challenging) api.startPlay(p.id); onOpen(); }}>
            {p.challenging ? t('도전 중') : t('도전')}
          </Button>
        )}
        {p.kind === 'video' && (
          <>
            <button onClick={onOpen} className="col-span-2 flex items-center gap-2 rounded-2xl bg-[rgba(116,116,128,0.08)] dark:bg-[rgba(118,118,128,0.18)] p-1.5 text-left hover:bg-slate-50 dark:hover:bg-white/5">
              <img src={p.thumbnail} alt="" className="w-16 aspect-video rounded object-cover" />
              <span className="flex-1 min-w-0 text-[11px] font-semibold truncate">{p.title}</span>
              <span className="text-[11px] font-bold text-blue-600 shrink-0">{t('미리보기')} ▶</span>
            </button>
            <Button onClick={() => api.acceptPending(p.id)}>{t('수락')}</Button>
            <Button variant="ghost" onClick={() => api.rejectPending(p.id)}>{t('거절')}</Button>
          </>
        )}
      </div>
    </li>
  );
}

/** 럭키박스: 번호를 고르면 [선택] 활성화 (p66 ②) */
function LuckyBoxPicker({ p }: { p: Extract<PendingItem, { kind: 'luckybox' }> }) {
  const [box, setBox] = useState<number | null>(null);
  return (
    <div className="col-span-2 space-y-1.5">
      <div className="grid grid-cols-6 gap-1">
        {Array.from({ length: p.boxes }, (_, i) => i + 1).map((n) => (
          <button key={n} aria-pressed={box === n} onClick={() => setBox(n)} className={`h-8 rounded-md text-xs font-black ${box === n ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-white/10 hover:bg-violet-100 dark:hover:bg-violet-500/20'}`}>
            {n}
          </button>
        ))}
      </div>
      <Button className="w-full" disabled={box === null} onClick={() => box !== null && api.pickLuckyBox(p.id, box)}>선택</Button>
    </div>
  );
}

/** 플레이 후원 정답 입력 (p67). 도전 후 남은 시간은 도네이터가 정한 제한 시간이며, 초과 시 오답 처리된다. */
function PlayQuestion({ p, now, onBack }: { p: Extract<PendingItem, { kind: 'play' }>; now: number; onBack: () => void }) {
  const [answer, setAnswer] = useState('');
  const modeLabel = { choice: '[객관식]', initial: '[주관식]', drawing: '[그림]' }[p.mode];
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 h-9 border-b border-black/[0.08] dark:border-white/10 shrink-0">
        <button aria-label="뒤로 가기" onClick={onBack} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10"><ArrowLeft size={15} /></button>
        <span className="text-xs font-bold">플레이 후원 정답 입력</span>
        <span className="ml-auto text-[11px] tabular-nums text-red-500 font-bold">남은 시간 {mmss(p.deadline - now)}</span>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-3 text-xs">
        <div className="text-[11px] text-slate-500">{p.nickname} · {modeLabel}</div>
        {p.mode === 'drawing' && <div className="aspect-video rounded-lg bg-[repeating-linear-gradient(45deg,#e2e8f0_0_10px,#f8fafc_10px_20px)] dark:bg-white/5 flex items-center justify-center text-slate-400">그림 문제</div>}
        <p className="text-sm font-bold leading-relaxed">{p.question}</p>
        {p.choices ? (
          <div className="grid grid-cols-2 gap-1.5">
            {p.choices.map((c, i) => (
              <button key={c} aria-pressed={answer === c} onClick={() => setAnswer(c)} className={`h-9 rounded-lg font-bold ${answer === c ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-white/10'}`}>
                {i + 1}. {c}
              </button>
            ))}
          </div>
        ) : (
          <>
            {p.hint && <p className="text-slate-500">[힌트] {p.hint}</p>}
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣\s]/g, ''))}
              placeholder="정답 입력 (한글만 가능)"
              maxLength={p.answerLength ?? 20}
              className="w-full h-9 px-3 rounded-xl bg-[rgba(120,120,128,0.12)] dark:bg-[rgba(120,120,128,0.24)] outline-none focus:ring-2 focus:ring-blue-600/40"
            />
            {p.answerLength && <p className="text-[11px] text-slate-400">[글자 수 : {p.answerLength}]</p>}
          </>
        )}
      </div>
      <div className="p-2 grid grid-cols-2 gap-1.5 border-t border-black/[0.08] dark:border-white/10">
        <Button variant="ghost" onClick={() => { api.giveUpPlay(p.id); onBack(); }}>포기</Button>
        <Button disabled={!answer.trim()} onClick={() => { api.submitPlay(p.id, answer); onBack(); }}>정답 제출</Button>
      </div>
    </div>
  );
}

/** 영상 후원 미리보기 (p64 ①) */
function VideoPreview({ p, onBack }: { p: Extract<PendingItem, { kind: 'video' }>; onBack: () => void }) {
  const t = useT();
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 h-9 border-b border-black/[0.08] dark:border-white/10 shrink-0">
        <button aria-label="뒤로 가기" onClick={onBack} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10"><ArrowLeft size={15} /></button>
        <span className="text-xs font-bold">영상 후원 미리보기</span>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2">
        <button onClick={() => openUrl(p.url)} className="relative block w-full rounded-lg overflow-hidden">
          <img src={p.thumbnail} alt="영상 썸네일" className="w-full aspect-video object-cover" />
          <span className="absolute inset-0 flex items-center justify-center"><PlayIcon size={36} className="text-white drop-shadow" /></span>
        </button>
        <div className="text-xs font-bold">[{p.platform}] {p.title}</div>
        <div className="text-[11px] text-slate-500">{p.nickname} · {formatCash(p.cash)} 캐시</div>
        <button onClick={() => openUrl(p.url)} className="text-[11px] font-bold text-blue-600 flex items-center gap-1"><ExternalLink size={12} /> 영상 보러 가기</button>
      </div>
      <div className="p-2 grid grid-cols-2 gap-1.5 border-t border-black/[0.08] dark:border-white/10">
        <Button onClick={() => { api.acceptPending(p.id); onBack(); }}>{t('수락')}</Button>
        <Button variant="ghost" onClick={() => { api.rejectPending(p.id); onBack(); }}>{t('거절')}</Button>
      </div>
    </div>
  );
}
