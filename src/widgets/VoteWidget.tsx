import { CalendarClock, Minus, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { api } from '../state/app';
import { mmss, useData, useNow } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { VOTE_ITEM_MAX, VOTE_ITEM_TEXT_MAX, emptyVoteForm, validateVote, type VoteField } from '../lib/vote';
import type { VoteForm } from '../types';
import { Button, Confirm, Toggle, fieldClass } from '../components/ui';

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
  const field = `${fieldClass} w-full`;

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
      <div className="flex-1 overflow-auto p-3 space-y-3 text-body">
        <select aria-label="투표 프리셋 설정" defaultValue="" onChange={(e) => applyPreset(Number(e.target.value))} className={field}>
          <option value="" disabled>투표 프리셋 설정</option>
          {presets.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}
        </select>

        <label className="block">
          <span className="font-semibold text-text">투표 이름</span>
          <input ref={(el) => { refs.current.name = el; }} className={`${field} mt-1`} placeholder="투표 이름을 입력해 주세요." maxLength={100} value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </label>

        <div>
          <span className="font-semibold text-text">투표 시간</span>
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
                <span className="text-text-secondary whitespace-nowrap">{['시간', '분', '초'][i]}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="font-semibold text-text">투표 금액</span>
            <div className="mt-1 relative">
              <input ref={(el) => { refs.current.price = el; }} inputMode="numeric" className={`${field} pr-9`} value={form.price} onChange={(e) => set({ price: digits(e.target.value) })} />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary">캐시</span>
            </div>
            <span className="text-micro text-text-tertiary">표 당 금액을 뜻합니다. (최소 금액 1,000 캐시)</span>
          </label>
          <label className="block">
            <span className="font-semibold text-text">무료 투표권</span>
            <input ref={(el) => { refs.current.freeTickets = el; }} inputMode="numeric" className={`${field} mt-1`} value={form.freeTickets} onChange={(e) => set({ freeTickets: digits(e.target.value) })} />
            <span className="text-micro text-text-tertiary">도네이터에게 제공되는 무료 투표권의 개수를 뜻합니다.</span>
          </label>
        </div>

        <div>
          <span className="font-semibold text-text">투표 항목</span>
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
                  <button aria-label="항목 삭제" onClick={() => set({ items: form.items.filter((_, j) => j !== i) })} className="w-[30px] shrink-0 rounded-control text-text-tertiary hover:text-text hover:bg-surface-raised flex items-center justify-center"><X size={14} /></button>
                )}
              </div>
            ))}
            {form.items.length < VOTE_ITEM_MAX && (
              <button onClick={() => set({ items: [...form.items, ''] })} className="w-full h-[30px] rounded-control border border-dashed border-line-control text-text-secondary font-semibold hover:text-text hover:bg-surface-raised">+ 항목 추가</button>
            )}
          </div>
        </div>

        <div className="rounded-card bg-surface-raised border border-line p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text flex items-center gap-1"><CalendarClock size={14} /> 투표 시작 예약</span>
            <Toggle size="sm" on={form.reserve} onChange={(v) => set({ reserve: v })} label="투표 시작 예약" />
          </div>
          {form.reserve && (
            <input ref={(el) => { refs.current.reserve = el; }} aria-label="예약 시각" type="datetime-local" step={1} min={fmt(Date.now()).replace(' ', 'T')} className={field} value={form.reserveAt} onChange={(e) => set({ reserveAt: e.target.value })} />
          )}
          <p className="text-micro text-text-tertiary leading-relaxed">투표 시작 예약을 하지 않고 투표 시작 버튼을 누르면 바로 투표가 시작됩니다.<br />투표사용하기가 OFF인 경우 투표가 시작되지 않습니다. 크리에이터 페이지 &gt; 위젯 &gt; 투표 &gt; 투표위젯 설정에서 투표 사용하기가 ON 상태이고, 하단의 [투표 시작] 버튼을 누르면 투표가 시작됩니다.</p>
        </div>
      </div>
      {/* 플로팅 버튼: 스크롤해도 위치 고정 (p76 ①) */}
      <div className="shrink-0 p-2.5 border-t border-line">
        <Button size="lg" className="w-full" onClick={start}>{t('투표 시작')}</Button>
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
    <div className="h-full flex flex-col text-body">
      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-tag text-micro font-bold whitespace-nowrap ${status === 'running' ? 'bg-brand text-text-on-brand' : status === 'paused' ? 'bg-warning text-text-on-warning' : 'bg-line-strong text-text'}`}>
            {status === 'running' ? '투표 진행 중' : status === 'paused' ? '투표 정지 중' : '예약 대기 중'}
          </span>
          {status === 'running' && vote.endsAt && <span className="font-num font-semibold text-link">- {mmss(vote.endsAt - now)}</span>}
          {status === 'reserved' && vote.reservedAt && <span className="font-num font-semibold text-text-secondary">- {mmss(vote.reservedAt - now)}</span>}
        </div>
        <h3 className="text-title-widget text-text">{f.name}</h3>
        <ul className="space-y-1">
          {f.items.map((i, n) => <li key={n} className="rounded-control bg-surface-raised border border-line px-3 py-2 font-semibold text-text">{i}</li>)}
        </ul>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-caption text-text-body">
          <dt className="text-text-secondary whitespace-nowrap">투표 금액</dt><dd>{Number(f.price).toLocaleString()} 캐시 (표 당)</dd>
          <dt className="text-text-secondary whitespace-nowrap">무료 투표권</dt><dd>{f.freeTickets || 0}개</dd>
          <dt className="text-text-secondary whitespace-nowrap">투표 시작 시간</dt><dd className="tabular-nums">{vote.startedAt ? fmt(vote.startedAt) : vote.reservedAt ? `${fmt(vote.reservedAt)} (예약)` : '-'}</dd>
          <dt className="text-text-secondary whitespace-nowrap">예상 종료 시간</dt>
          <dd className="tabular-nums">{status === 'paused' ? '투표 정지 중' : vote.endsAt ? fmt(vote.endsAt) : '-'}</dd>
        </dl>
        {status !== 'reserved' && (
          <div className="flex items-center gap-1.5">
            <span className="text-caption font-semibold text-text-secondary mr-1 whitespace-nowrap">시간 수정</span>
            <Button variant="secondary" size="sm" className="!px-2" onClick={() => api.extendVote(-60)}><Minus size={12} /></Button>
            <span className="text-caption">1분</span>
            <Button variant="secondary" size="sm" className="!px-2" onClick={() => api.extendVote(60)}><Plus size={12} /></Button>
          </div>
        )}
      </div>
      <div className="shrink-0 p-2.5 grid grid-cols-2 gap-1.5 border-t border-line">
        {status === 'running' && <Button variant="secondary" onClick={api.pauseVote}>{t('투표 정지')}</Button>}
        {status === 'paused' && <Button onClick={api.resumeVote}>{t('투표 재개')}</Button>}
        {status === 'reserved' && <Button variant="secondary" disabled>예약 대기 중</Button>}
        <Button variant="danger" onClick={() => setConfirmEnd(true)}>{t('투표 종료')}</Button>
      </div>
      {confirmEnd && <Confirm danger confirmLabel={t('투표 종료')} message="투표를 종료하시겠습니까?" onConfirm={() => { api.endVote(); setConfirmEnd(false); }} onCancel={() => setConfirmEnd(false)} />}
    </div>
  );
}
