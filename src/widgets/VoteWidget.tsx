import { CalendarClock, Minus, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { api } from '../state/app';
import { mmss, useData, useNow } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { VOTE_ITEM_MAX, VOTE_ITEM_TEXT_MAX, emptyVoteForm, validateVote, type VoteField } from '../lib/vote';
import type { VoteForm } from '../types';
import { Button, Confirm, Toggle } from '../components/ui';

const fmt = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

/** 투표 (p74~78) */
export default function VoteWidget() {
  const vote = useData((d) => d.vote);
  if (vote.status === 'idle') return <VoteSetup />;
  return <VoteRunning />;
}

function VoteSetup() {
  const t = useT();
  const presets = useData((d) => d.votePresets);
  const [form, setForm] = useState<VoteForm>(emptyVoteForm);
  const refs = useRef<Partial<Record<VoteField, HTMLElement | null>>>({});
  const set = (patch: Partial<VoteForm>) => setForm((f) => ({ ...f, ...patch }));
  const digits = (v: string) => v.replace(/\D/g, '');
  const field = 'h-9 px-3 rounded-xl bg-[rgba(120,120,128,0.12)] dark:bg-[rgba(120,120,128,0.24)] outline-none focus:ring-2 focus:ring-blue-600/40 text-xs w-full';

  const applyPreset = (i: number) => {
    const p = presets[i];
    if (!p) return;
    set({
      name: p.name,
      items: [...p.items],
      price: String(p.price),
      freeTickets: String(p.freeTickets),
      hours: String(Math.floor(p.seconds / 3600)),
      minutes: String(Math.floor((p.seconds % 3600) / 60)),
      seconds: String(p.seconds % 60),
    });
  };

  const start = () => {
    const err = validateVote(form, Date.now());
    if (err) {
      api.toast(err.message, 'error');
      refs.current[err.field]?.focus();
      return;
    }
    api.startVote({ ...form, items: form.items.filter((i) => i.trim()) });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-3 space-y-3 text-xs">
        <select aria-label="투표 프리셋 설정" defaultValue="" onChange={(e) => applyPreset(Number(e.target.value))} className={field}>
          <option value="" disabled>투표 프리셋 설정</option>
          {presets.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}
        </select>

        <label className="block">
          <span className="font-bold">투표 이름</span>
          <input ref={(el) => { refs.current.name = el; }} className={`${field} mt-1`} placeholder="투표 이름을 입력해 주세요." maxLength={100} value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </label>

        <div>
          <span className="font-bold">투표 시간</span>
          <div className="mt-1 flex items-center gap-1">
            {(['hours', 'minutes', 'seconds'] as const).map((k, i) => (
              <span key={k} className="flex items-center gap-1">
                <input
                  ref={i === 0 ? (el) => { refs.current.time = el; } : undefined}
                  aria-label={['시간', '분', '초'][i]}
                  inputMode="numeric"
                  className={`${field} w-14 text-center`}
                  placeholder="00"
                  value={form[k]}
                  onChange={(e) => set({ [k]: digits(e.target.value).slice(0, i === 0 ? 3 : 2) })}
                />
                <span className="text-slate-500">{['시간', '분', '초'][i]}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="font-bold">투표 금액</span>
            <div className="mt-1 relative">
              <input ref={(el) => { refs.current.price = el; }} inputMode="numeric" className={`${field} pr-9`} value={form.price} onChange={(e) => set({ price: digits(e.target.value) })} />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">캐시</span>
            </div>
            <span className="text-[10px] text-slate-400">표 당 금액을 뜻합니다. (최소 금액 1,000 캐시)</span>
          </label>
          <label className="block">
            <span className="font-bold">무료 투표권</span>
            <input ref={(el) => { refs.current.freeTickets = el; }} inputMode="numeric" className={`${field} mt-1`} value={form.freeTickets} onChange={(e) => set({ freeTickets: digits(e.target.value) })} />
            <span className="text-[10px] text-slate-400">도네이터에게 제공되는 무료 투표권의 개수를 뜻합니다.</span>
          </label>
        </div>

        <div>
          <span className="font-bold">투표 항목</span>
          <div className="mt-1 space-y-1.5">
            {form.items.map((item, i) => (
              <div key={i} className="flex gap-1">
                <input
                  ref={i === 0 ? (el) => { refs.current.items = el; } : undefined}
                  aria-label={`투표 항목 ${i + 1}`}
                  className={field}
                  maxLength={VOTE_ITEM_TEXT_MAX}
                  placeholder="투표의 내용을 작성해 주세요. (10자 이내)"
                  value={item}
                  onChange={(e) => set({ items: form.items.map((x, j) => (j === i ? e.target.value : x)) })}
                />
                {form.items.length > 2 && (
                  <button aria-label="항목 삭제" onClick={() => set({ items: form.items.filter((_, j) => j !== i) })} className="w-9 shrink-0 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center"><X size={14} /></button>
                )}
              </div>
            ))}
            {form.items.length < VOTE_ITEM_MAX && (
              <button onClick={() => set({ items: [...form.items, ''] })} className="w-full h-8 rounded-lg border border-dashed border-slate-300 dark:border-white/15 text-slate-500 font-bold">+ 항목 추가</button>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-[rgba(116,116,128,0.08)] dark:bg-[rgba(118,118,128,0.18)] p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1"><CalendarClock size={14} /> 투표 시작 예약</span>
            <Toggle size="sm" on={form.reserve} onChange={(v) => set({ reserve: v })} label="투표 시작 예약" />
          </div>
          {form.reserve && (
            <input ref={(el) => { refs.current.reserve = el; }} aria-label="예약 시각" type="datetime-local" step={1} min={fmt(Date.now()).replace(' ', 'T')} className={field} value={form.reserveAt} onChange={(e) => set({ reserveAt: e.target.value })} />
          )}
          <p className="text-[10px] text-slate-400 leading-relaxed">투표 시작 예약을 하지 않고 투표 시작 버튼을 누르면 바로 투표가 시작됩니다.<br />투표사용하기가 OFF인 경우 투표가 시작되지 않습니다. 크리에이터 페이지 &gt; 위젯 &gt; 투표 &gt; 투표위젯 설정에서 투표 사용하기가 ON 상태이고, 하단의 [투표 시작] 버튼을 누르면 투표가 시작됩니다.</p>
        </div>
      </div>
      {/* 플로팅 버튼: 스크롤해도 위치 고정 (p76 ①) */}
      <div className="shrink-0 p-2 border-t border-black/[0.08] dark:border-white/10">
        <Button className="w-full h-10" onClick={start}>{t('투표 시작')}</Button>
      </div>
    </div>
  );
}

function VoteRunning() {
  const t = useT();
  const vote = useData((d) => d.vote);
  const now = useNow();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const f = vote.form!;
  const status = vote.status;
  return (
    <div className="h-full flex flex-col text-xs">
      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white ${status === 'running' ? 'bg-blue-600' : status === 'paused' ? 'bg-amber-500' : 'bg-slate-500'}`}>
            {status === 'running' ? '투표 진행 중' : status === 'paused' ? '투표 정지 중' : '예약 대기 중'}
          </span>
          {status === 'running' && vote.endsAt && <span className="tabular-nums font-bold text-blue-600">- {mmss(vote.endsAt - now)}</span>}
          {status === 'reserved' && vote.reservedAt && <span className="tabular-nums font-bold text-slate-500">- {mmss(vote.reservedAt - now)}</span>}
        </div>
        <h3 className="text-sm font-black">{f.name}</h3>
        <ul className="space-y-1">
          {f.items.map((i, n) => <li key={n} className="rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2 font-semibold">{i}</li>)}
        </ul>
        <dl className="grid grid-cols-[88px_1fr] gap-y-1.5 text-[11px]">
          <dt className="text-slate-500">투표 금액</dt><dd>{Number(f.price).toLocaleString()} 캐시 (표 당)</dd>
          <dt className="text-slate-500">무료 투표권</dt><dd>{f.freeTickets || 0}개</dd>
          <dt className="text-slate-500">투표 시작 시간</dt><dd className="tabular-nums">{vote.startedAt ? fmt(vote.startedAt) : vote.reservedAt ? `${fmt(vote.reservedAt)} (예약)` : '-'}</dd>
          <dt className="text-slate-500">예상 종료 시간</dt>
          <dd className="tabular-nums">{status === 'paused' ? '투표 정지 중' : vote.endsAt ? fmt(vote.endsAt) : '-'}</dd>
        </dl>
        {status !== 'reserved' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1">시간 수정</span>
            <Button variant="ghost" className="h-7 px-2" onClick={() => api.extendVote(-60)}><Minus size={12} /></Button>
            <span className="text-[11px]">1분</span>
            <Button variant="ghost" className="h-7 px-2" onClick={() => api.extendVote(60)}><Plus size={12} /></Button>
          </div>
        )}
      </div>
      <div className="shrink-0 p-2 grid grid-cols-2 gap-1.5 border-t border-black/[0.08] dark:border-white/10">
        {status === 'running' && <Button variant="ghost" onClick={api.pauseVote}>{t('투표 정지')}</Button>}
        {status === 'paused' && <Button onClick={api.resumeVote}>{t('투표 재개')}</Button>}
        {status === 'reserved' && <Button variant="ghost" disabled>예약 대기 중</Button>}
        <Button variant="danger" onClick={() => setConfirmEnd(true)}>{t('투표 종료')}</Button>
      </div>
      {confirmEnd && <Confirm message="투표를 종료하시겠습니까?" onConfirm={() => { api.endVote(); setConfirmEnd(false); }} onCancel={() => setConfirmEnd(false)} />}
    </div>
  );
}
