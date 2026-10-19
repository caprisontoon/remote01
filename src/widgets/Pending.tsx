import { ArrowLeft, ExternalLink, Play as PlayIcon, Timer } from 'lucide-react';
import { useState } from 'react';
import { api } from '../state/app';
import { mmss, useData, useNow } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { openUrl } from '../platform';
import type { PendingItem } from '../types';
import { Badge, Button, Cash, Empty, fieldClass } from '../components/ui';
import { WidgetHeader } from '../shell/WidgetFrame';
import { KindTag } from './donations/parts';


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
      <WidgetHeader>
        <span className="self-center"><Badge count={pending.length} /></span>
      </WidgetHeader>
      {pending.length === 0 ? (
        <Empty>대기 중인 후원이 없습니다.</Empty>
      ) : (
        <ul className="flex-1 overflow-auto p-2.5 space-y-2">
          {pending.map((p) => (
            <Card key={p.id} p={p} now={now} onOpen={() => setDetail(p.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** 카드 = surface-raised + 1px line + radius-card. 종류 태그는 외곽선형, 버튼은 주 버튼 / 외곽선 버튼 한 쌍. */
function Card({ p, now, onOpen }: { p: PendingItem; now: number; onOpen: () => void }) {
  const t = useT();
  const remain = p.deadline - now;
  const urgent = remain < 15_000;
  const cashLabel = p.kind === 'video' ? '후원캐시' : '성공캐시';
  const desc = p.kind === 'quest' ? p.title : p.kind === 'video' ? `[${p.platform}] ${p.title}` : p.kind === 'luckybox' ? '럭키박스 결과 확인 대기' : '플레이 후원 도전 대기';
  return (
    <li className="rounded-card bg-surface-raised border border-line p-3">
      <div className="flex items-center gap-2 min-w-0">
        <KindTag kind={p.kind} />
        <span className="flex-1 min-w-0 truncate font-semibold text-text">{p.nickname}</span>
        <span className="shrink-0 text-text" title={cashLabel}><Cash value={p.cash} /></span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-caption">
        <span className={`flex-1 min-w-0 truncate ${p.kind === 'quest' ? 'text-text font-semibold' : 'text-text-secondary'}`}>{desc}</span>
        <span className={`shrink-0 flex items-center gap-1 tabular-nums ${urgent ? 'text-danger font-semibold' : 'text-text-tertiary'}`}>
          <Timer size={12} /> {p.kind === 'play' && p.challenging ? '남은 시간' : '[남은 시간]'} {mmss(remain)}
        </span>
      </div>
      {p.kind === 'video' && (
        <button onClick={onOpen} className="mt-2 w-full flex items-center gap-2 rounded-control border border-line p-1.5 text-left hover:bg-surface-sunken">
          <img src={p.thumbnail} alt="" className="w-16 aspect-video rounded-tag object-cover" />
          <span className="flex-1 min-w-0 text-caption text-text-body truncate">{p.title}</span>
          <span className="text-caption font-semibold text-link shrink-0">{t('미리보기')} ▶</span>
        </button>
      )}
      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
        {p.kind === 'quest' && !p.accepted && (
          <>
            <Button onClick={() => api.acceptPending(p.id)}>{t('수락')}</Button>
            <Button variant="outline" onClick={() => api.rejectPending(p.id)}>{t('거절')}</Button>
          </>
        )}
        {p.kind === 'quest' && p.accepted && (
          <>
            <Button onClick={() => api.resolveQuest(p.id, true)}>{t('성공')}</Button>
            <Button variant="outline" onClick={() => api.resolveQuest(p.id, false)}>{t('실패')}</Button>
          </>
        )}
        {p.kind === 'luckybox' && <LuckyBoxPicker p={p} />}
        {p.kind === 'play' && (
          <Button className="col-span-2" variant={p.challenging ? 'secondary' : 'primary'} onClick={() => { if (!p.challenging) api.startPlay(p.id); onOpen(); }}>
            {p.challenging ? t('도전 중') : t('도전')}
          </Button>
        )}
        {p.kind === 'video' && (
          <>
            <Button onClick={() => api.acceptPending(p.id)}>{t('수락')}</Button>
            <Button variant="outline" onClick={() => api.rejectPending(p.id)}>{t('거절')}</Button>
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
          <button key={n} aria-pressed={box === n} onClick={() => setBox(n)} className={`h-[30px] rounded-control border text-caption font-semibold font-num ${box === n ? 'bg-brand border-brand text-text-on-brand' : 'bg-surface border-line-strong text-text hover:bg-surface-sunken'}`}>
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
      <div className="flex items-center gap-2 px-2 h-10 border-b border-line shrink-0">
        <button aria-label="뒤로 가기" onClick={onBack} className="p-1 rounded-control text-text-secondary hover:text-text hover:bg-surface-raised"><ArrowLeft size={15} /></button>
        <span className="text-body font-semibold text-text">플레이 후원 정답 입력</span>
        <span className="ml-auto text-caption tabular-nums text-danger font-semibold">남은 시간 {mmss(p.deadline - now)}</span>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-3 text-body">
        <div className="text-caption text-text-secondary">{p.nickname} · {modeLabel}</div>
        {p.mode === 'drawing' && <div className="aspect-video rounded-card bg-surface-raised border border-line flex items-center justify-center text-text-tertiary">그림 문제</div>}
        <p className="text-[0.875rem] font-semibold text-text leading-relaxed">{p.question}</p>
        {p.choices ? (
          <div className="grid grid-cols-2 gap-1.5">
            {p.choices.map((c, i) => (
              <button key={c} aria-pressed={answer === c} onClick={() => setAnswer(c)} className={`h-[34px] rounded-control border font-semibold ${answer === c ? 'bg-brand border-brand text-text-on-brand' : 'bg-surface-raised border-line-strong text-text hover:bg-surface-sunken'}`}>
                {i + 1}. {c}
              </button>
            ))}
          </div>
        ) : (
          <>
            {p.hint && <p className="text-text-secondary">[힌트] {p.hint}</p>}
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣\s]/g, ''))}
              placeholder="정답 입력 (한글만 가능)"
              maxLength={p.answerLength ?? 20}
              className={`${fieldClass} w-full h-[34px]`}
            />
            {p.answerLength && <p className="text-caption text-text-tertiary">[글자 수 : {p.answerLength}]</p>}
          </>
        )}
      </div>
      <div className="p-2.5 grid grid-cols-2 gap-1.5 border-t border-line">
        <Button variant="outline" onClick={() => { api.giveUpPlay(p.id); onBack(); }}>포기</Button>
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
      <div className="flex items-center gap-2 px-2 h-10 border-b border-line shrink-0">
        <button aria-label="뒤로 가기" onClick={onBack} className="p-1 rounded-control text-text-secondary hover:text-text hover:bg-surface-raised"><ArrowLeft size={15} /></button>
        <span className="text-body font-semibold text-text">영상 후원 미리보기</span>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2">
        <button onClick={() => openUrl(p.url)} className="relative block w-full rounded-card overflow-hidden">
          <img src={p.thumbnail} alt="영상 썸네일" className="w-full aspect-video object-cover" />
          <span className="absolute inset-0 flex items-center justify-center"><PlayIcon size={36} className="text-white drop-shadow" /></span>
        </button>
        <div className="text-body font-semibold text-text">[{p.platform}] {p.title}</div>
        <div className="text-caption text-text-secondary">{p.nickname} · <Cash value={p.cash} /> 캐시</div>
        <button onClick={() => openUrl(p.url)} className="text-caption font-semibold text-link flex items-center gap-1"><ExternalLink size={12} /> 영상 보러 가기</button>
      </div>
      <div className="p-2.5 grid grid-cols-2 gap-1.5 border-t border-line">
        <Button onClick={() => { api.acceptPending(p.id); onBack(); }}>{t('수락')}</Button>
        <Button variant="outline" onClick={() => { api.rejectPending(p.id); onBack(); }}>{t('거절')}</Button>
      </div>
    </div>
  );
}
