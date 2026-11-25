import { Download, ExternalLink, Flame, History, Minus, Plus, Target } from 'lucide-react';
import { useState } from 'react';
import { api } from '../state/app';
import { useData, useNow, mmss } from '../lib/hooks';
import { openUrl } from '../platform';
import type { CrewLog, CrewMember, CrewState } from '../types';
import { Button, Cash, Confirm, Modal, fieldClass } from '../components/ui';
import {
  CREW_MAX_JOINED,
  MANUAL_MAX,
  MANUAL_MIN,
  START_BLOCK_MESSAGE,
  goalPercent,
  isCrewLive,
  rankMembers,
  receivingPaused,
  startBlockers,
  startWarning,
  validateManual,
  type CrewGate,
  type ManualField,
} from '../lib/crew';
import { focusWidget } from '../shell/focusWidget';

const SETTINGS_URL = 'https://toon.at/streamer/crew';
const fmt = (ms: number) => new Date(ms).toLocaleString('ko-KR', { hour12: false });
const num = (n: number) => n.toLocaleString('ko-KR');

function useGate(): CrewGate {
  const crew = useData((d) => d.crew);
  const usageMaster = useData((d) => d.usageMaster);
  const usageCrew = useData((d) => d.usage.crew);
  return { crew, usageMaster, usageCrew };
}

/**
 * 크루 후원 (리모컨 개편 p79~80 + 크루 후원 1.5차 p5~6).
 * 준비 → 방송 중 → 결과. [후원 사용] 위젯과 같은 상태를 본다:
 * - 크루 후원이 꺼져 있으면 방송을 시작할 수 없고, [후원 사용]에서 먼저 켜게 안내한다.
 * - 방송 중에 전체 후원이 꺼지면 방송은 유지되고 "후원 받기 중지됨"을 띄운다.
 */
export default function Crew() {
  const gate = useGate();
  const { crew } = gate;
  if (crew.result) return <Result result={crew.result} />;
  return isCrewLive(crew) ? <Live gate={gate} /> : <Ready gate={gate} />;
}

/** [후원 사용] 위젯으로 안내하는 버튼 */
function OpenUsage({ label = '후원 사용 열기' }: { label?: string }) {
  return (
    <Button size="sm" variant="secondary" onClick={() => focusWidget('usage')}>
      {label}
    </Button>
  );
}

function SettingsLink() {
  return (
    <button className="text-caption text-link font-semibold inline-flex items-center gap-1 shrink-0 whitespace-nowrap" onClick={() => openUrl(SETTINGS_URL)}>
      방송 설정 페이지 <ExternalLink size={11} />
    </button>
  );
}

/** 시즌·방송 제목과 점수 이벤트·후원 목표 (방송 설정은 크리에이터 페이지에서) */
function BroadcastInfo({ crew }: { crew: CrewState }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-body">
      <dt className="text-text-secondary whitespace-nowrap">시즌</dt>
      <dd className="min-w-0 flex items-center gap-1.5 text-text">
        <span className="truncate">{crew.season?.name ?? '-'}</span>
        {crew.season && (
          <span className={`shrink-0 px-1.5 rounded-tag border text-micro font-semibold ${crew.season.open ? 'bg-brand-tint border-brand-tint-line text-brand-hover dark:text-link' : 'bg-surface-sunken border-line text-text-secondary'}`}>
            {crew.season.open ? '진행중' : '종료'}
          </span>
        )}
      </dd>
      <dt className="text-text-secondary whitespace-nowrap">방송 제목</dt>
      <dd className="text-text truncate">{crew.title || '-'}</dd>
      <dt className="text-text-secondary whitespace-nowrap">점수 이벤트</dt>
      <dd className="text-text">
        {crew.event.on ? (
          <span className="inline-flex items-center gap-1">
            <Flame size={13} className="text-warning-text" />
            후원 점수 X{crew.event.score} · 기여도 X{crew.event.contribution}
          </span>
        ) : (
          <span className="text-text-tertiary">사용 안 함</span>
        )}
      </dd>
      <dt className="text-text-secondary whitespace-nowrap">후원 목표</dt>
      <dd className="text-text">
        {crew.goal.on ? (
          <span className="inline-flex items-center gap-1">
            <Target size={13} className="text-text-secondary" />
            <span className="font-num">{num(crew.goal.score)}</span>점
          </span>
        ) : (
          <span className="text-text-tertiary">사용 안 함</span>
        )}
      </dd>
    </dl>
  );
}

function Ready({ gate }: { gate: CrewGate }) {
  const { crew } = gate;
  const [confirm, setConfirm] = useState(false);
  const blocks = startBlockers(gate);
  const warning = startWarning(gate);
  const joined = crew.members.filter((m) => m.joined);

  return (
    <div className="h-full flex flex-col text-body">
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {!gate.usageCrew && (
          <div className="rounded-card border border-line-strong bg-surface-raised p-3 space-y-2">
            <p className="font-semibold text-text">크루 후원이 꺼져 있습니다.</p>
            <p className="text-caption text-text-secondary">[후원 사용] 위젯에서 크루를 켜면 방송을 시작할 수 있습니다.</p>
            <OpenUsage />
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-caption font-bold text-text-secondary pt-0.5">방송 정보</h3>
          <SettingsLink />
        </div>
        <BroadcastInfo crew={crew} />
        <div>
          <div className="font-semibold text-text mb-1">
            방송 참여 크루 <span className="font-num text-text-secondary font-normal">{joined.length}/{CREW_MAX_JOINED}</span>
          </div>
          {joined.length ? <MemberTable crew={crew} members={joined} /> : <p className="text-caption text-text-tertiary py-3 text-center">방송 참여 크루가 없습니다.</p>}
        </div>
      </div>
      <div className="p-2.5 border-t border-line space-y-2">
        {/* 크루 OFF는 위 안내 상자에서 보여 주므로 여기서는 나머지 이유만 */}
        {blocks.filter((b) => b !== 'crewOff').map((b) => (
          <p key={b} className="text-caption text-danger">{START_BLOCK_MESSAGE[b]}</p>
        ))}
        <Button className="w-full" disabled={blocks.length > 0} onClick={() => setConfirm(true)}>
          방송 시작
        </Button>
      </div>
      {confirm && (
        <Confirm
          message="크루 방송을 시작 하시겠습니까?"
          note={warning ?? undefined}
          confirmLabel="방송 시작"
          onConfirm={() => {
            api.startCrew();
            setConfirm(false);
          }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </div>
  );
}

function Live({ gate }: { gate: CrewGate }) {
  const { crew } = gate;
  const now = useNow();
  const [confirm, setConfirm] = useState(false);
  const [edit, setEdit] = useState<{ member: CrewMember; field: ManualField } | null>(null);
  const [history, setHistory] = useState(false);
  const joined = crew.members.filter((m) => m.joined);
  const paused = receivingPaused(gate);

  return (
    <div className="h-full flex flex-col text-body">
      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 px-1.5 py-0.5 rounded-tag bg-danger text-white text-micro font-bold">LIVE</span>
              <span className="font-num text-caption text-text-secondary">{mmss(now - crew.liveSince!)}</span>
            </div>
            <div className="mt-1 text-title-widget text-text truncate">
              [{crew.season?.name}] {crew.title}
            </div>
          </div>
          <Button variant="danger" size="sm" className="shrink-0" onClick={() => setConfirm(true)}>
            방송 종료
          </Button>
        </div>
        {paused && (
          <div role="status" className="rounded-card border border-warning/40 bg-warning/15 p-3 space-y-2">
            <p className="font-semibold text-warning-text">후원 받기 중지됨</p>
            <p className="text-caption text-text-body">전체 후원이 꺼져 있어 지금은 크루 후원을 받을 수 없습니다. [후원 사용]에서 켜면 이어서 받습니다. 방송은 계속 진행 중입니다.</p>
            <OpenUsage />
          </div>
        )}
        <BroadcastInfo crew={crew} />
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-text">방송 참여 크루</span>
            <button className="text-caption text-link font-semibold inline-flex items-center gap-1" onClick={() => setHistory(true)}>
              <History size={12} /> 점수 / 기여도 내역
            </button>
          </div>
          <MemberTable crew={crew} members={joined} onEdit={(member, field) => setEdit({ member, field })} />
        </div>
      </div>
      <div className="px-3 py-2 border-t border-line flex justify-between gap-2 font-semibold text-text">
        <span>이번 방송 후원 캐시</span>
        <span className="whitespace-nowrap">
          <Cash value={crew.totalCash} /> 캐시
        </span>
      </div>
      {confirm && (
        <Confirm
          danger
          confirmLabel="방송 종료"
          message="크루 방송을 종료 하시겠습니까?"
          note="종료하면 방송 결과가 기록되고 되돌릴 수 없습니다."
          onConfirm={() => {
            api.endCrew();
            setConfirm(false);
          }}
          onCancel={() => setConfirm(false)}
        />
      )}
      {edit && (
        <AdjustDialog
          // 점수가 바뀌어도 열려 있는 창에 현재 값이 보이도록 최신 크루 정보를 넘긴다
          member={crew.members.find((m) => m.id === edit.member.id) ?? edit.member}
          field={edit.field}
          onClose={() => setEdit(null)}
        />
      )}
      {history && <HistoryDialog crew={crew} onClose={() => setHistory(false)} />}
    </div>
  );
}

function Result({ result }: { result: NonNullable<CrewState['result']> }) {
  const ranked = rankMembers(result.ranking);
  return (
    <div className="h-full flex flex-col text-body">
      <div className="flex-1 overflow-auto p-3 space-y-3">
        <p className="text-center font-semibold text-text">
          방송이 종료 되었습니다.
          <br />
          <span className="text-text-secondary font-normal">방송 결과를 확인해 보세요.</span>
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="text-text-secondary whitespace-nowrap">방송명</dt>
          <dd className="font-semibold text-text">{result.title}</dd>
          <dt className="text-text-secondary whitespace-nowrap">방송 시간</dt>
          <dd className="tabular-nums text-text-body">
            {fmt(result.startedAt)} ~ {fmt(result.endedAt)} (총 {Math.round((result.endedAt - result.startedAt) / 60000)}분)
          </dd>
        </dl>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[300px] border-collapse text-caption whitespace-nowrap">
            <thead>
              <tr className="bg-surface-sunken text-text-secondary">
                <th className="h-8 px-2 font-medium text-left">순위</th>
                <th className="h-8 px-2 font-medium text-left">직급</th>
                <th className="h-8 px-2 font-medium text-left">크루 명</th>
                <th className="h-8 px-2 font-medium text-right">후원 점수</th>
                <th className="h-8 px-2 font-medium text-right">기여도</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((m) => (
                <tr key={m.id} className="border-b border-line-subtle text-text-body">
                  <td className="py-1.5 px-2 font-semibold text-text">{m.place}</td>
                  <td className="py-1.5 px-2">{m.rank}</td>
                  <td className="py-1.5 px-2 font-semibold text-text">{m.name}</td>
                  <td className="py-1.5 px-2 text-right font-num">{num(m.score)}</td>
                  <td className={`py-1.5 px-2 text-right font-num ${m.contribution < 0 ? 'text-danger' : ''}`}>{num(m.contribution)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-card bg-surface-raised border border-line px-3 py-2 flex justify-between gap-2 font-semibold text-text">
          <span className="whitespace-nowrap">총 후원 캐시</span>
          <span className="whitespace-nowrap">
            <Cash value={result.totalCash} /> 캐시
          </span>
        </div>
      </div>
      <div className="p-2.5 border-t border-line">
        <Button className="w-full" onClick={api.closeCrewResult}>
          확인
        </Button>
      </div>
    </div>
  );
}

/** 참여 크루 표. 방송 중이면 후원 점수·기여도 옆에 ± 버튼, 후원 목표가 켜져 있으면 목표 달성 열 (1.5차 p5·p9) */
function MemberTable({ crew, members, onEdit }: { crew: CrewState; members: CrewMember[]; onEdit?: (m: CrewMember, field: ManualField) => void }) {
  const editBtn = (m: CrewMember, field: ManualField) =>
    onEdit && (
      <button
        type="button"
        onClick={() => onEdit(m, field)}
        aria-label={`${m.name} ${field === 'score' ? '후원 점수' : '기여도'} 수정`}
        title={field === 'score' ? '후원 점수 수정' : '기여도 수정'}
        className="ml-1 w-5 h-5 inline-flex items-center justify-center rounded-tag border border-line-control text-text-secondary hover:text-text hover:bg-surface-raised align-middle"
      >
        <span className="text-[0.6875rem] leading-none font-bold">±</span>
      </button>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] border-collapse text-caption whitespace-nowrap">
        <thead>
          <tr className="bg-surface-sunken text-text-secondary">
            <th className="h-8 px-2 font-medium text-left">직급</th>
            <th className="h-8 px-2 font-medium text-left">크루 명</th>
            <th className="h-8 px-2 font-medium text-right">후원 점수</th>
            <th className="h-8 px-2 font-medium text-right">기여도</th>
            {crew.goal.on && <th className="h-8 px-2 font-medium text-right">목표 달성</th>}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const pct = crew.goal.on ? goalPercent(m.score, crew.goal.score) : null;
            return (
              <tr key={m.id} className="border-b border-line-subtle text-text-body">
                <td className="py-1.5 px-2">{m.rank}</td>
                <td className="py-1.5 px-2 font-semibold text-text">{m.name}</td>
                <td className="py-1.5 px-2 text-right font-num">
                  {num(m.score)}
                  {editBtn(m, 'score')}
                </td>
                <td className={`py-1.5 px-2 text-right font-num ${m.contribution < 0 ? 'text-danger' : ''}`}>
                  {num(m.contribution)}
                  {editBtn(m, 'contribution')}
                </td>
                {crew.goal.on && <td className={`py-1.5 px-2 text-right font-num ${pct !== null && pct >= 100 ? 'text-link font-semibold' : ''}`}>{pct === null ? '-' : `${pct.toFixed(1)}%`}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** 점수 수정 / 기여도 수정 (1.5차 p5). 플러스·마이너스 + 1~1,000,000. 점수 이벤트 배수는 적용하지 않는다 */
function AdjustDialog({ member, field, onClose }: { member: CrewMember; field: ManualField; onClose: () => void }) {
  const [sign, setSign] = useState<1 | -1>(1);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const label = field === 'score' ? '후원 점수' : '기여도';
  const current = member[field];
  const save = () => {
    const r = validateManual(field, current, sign, value);
    if (!r.ok) return setError(r.error);
    api.adjustCrew(member.id, field, r.delta);
    onClose();
  };
  return (
    <Modal
      title={`${field === 'score' ? '점수' : '기여도'} 수정 · ${member.name}`}
      onClose={onClose}
      width="max-w-sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={save}>저장</Button>
        </>
      }
    >
      <div className="p-4 space-y-3 text-body">
        <p className="text-text-secondary">
          현재 {label} <span className={`font-num font-semibold ${current < 0 ? 'text-danger' : 'text-link'}`}>{num(current)}</span>
        </p>
        <div className="flex items-center gap-3" role="radiogroup" aria-label="더하기 또는 빼기">
          {([1, -1] as const).map((s) => (
            <label key={s} className="flex items-center gap-1.5 cursor-pointer text-text">
              <input type="radio" name="sign" className="accent-brand" checked={sign === s} onChange={() => setSign(s)} />
              {s === 1 ? <Plus size={13} /> : <Minus size={13} />}
              {s === 1 ? '플러스' : '마이너스'}
            </label>
          ))}
        </div>
        <input
          autoFocus
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder={`${label} 입력 ${MANUAL_MIN} ~ ${num(MANUAL_MAX)}`}
          className={`${fieldClass} w-full h-[34px] font-num`}
          aria-invalid={!!error}
        />
        {error ? <p className="text-caption text-danger">{error}</p> : <p className="text-caption text-text-tertiary">점수 이벤트 배수는 적용되지 않습니다.</p>}
      </div>
    </Modal>
  );
}

const PAGE = 10;

/** 점수 / 기여도 내역 (1.5차 p6): 후원·수동 구분, 마이너스는 붉게, 엑셀(CSV) 다운로드 */
function HistoryDialog({ crew, onClose }: { crew: CrewState; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const logs = crew.logs;
  const last = Math.max(1, Math.ceil(logs.length / PAGE));
  const rows = logs.slice((page - 1) * PAGE, page * PAGE);
  const signed = (n: number) => (n === 0 ? '' : num(n));
  return (
    <Modal title="점수 / 기여도 내역" onClose={onClose} width="max-w-2xl">
      <div className="p-4 space-y-3 text-body">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-card bg-surface-raised border border-line px-3 py-2">
          <dt className="text-text-secondary">시즌 명</dt>
          <dd className="text-text">{crew.season?.name}</dd>
          <dt className="text-text-secondary">방송 명</dt>
          <dd className="text-text">{crew.title}</dd>
        </dl>
        <div className="flex items-center justify-between">
          <h3 className="text-caption font-bold text-text-secondary">상세 내역 <span className="font-num font-normal">{num(logs.length)}건</span></h3>
          <Button size="sm" variant="outline" disabled={!logs.length} onClick={() => downloadLogs(crew)}>
            <span className="inline-flex items-center gap-1"><Download size={13} /> 다운로드</span>
          </Button>
        </div>
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[520px] border-collapse text-caption whitespace-nowrap">
            <thead>
              <tr className="bg-surface-sunken text-text-secondary">
                <th className="h-8 px-2 font-medium text-left">구분</th>
                <th className="h-8 px-2 font-medium text-left">크루 명</th>
                <th className="h-8 px-2 font-medium text-right">후원 점수</th>
                <th className="h-8 px-2 font-medium text-right">기여도</th>
                <th className="h-8 px-2 font-medium text-left">비고</th>
                <th className="h-8 px-2 font-medium text-left">일시</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-b border-line-subtle text-text-body">
                  <td className="py-1.5 px-2">{l.kind === 'donation' ? '후원' : '수동'}</td>
                  <td className="py-1.5 px-2 font-semibold text-text">{l.name}</td>
                  <td className={`py-1.5 px-2 text-right font-num ${l.score < 0 ? 'text-danger' : ''}`}>{signed(l.score)}</td>
                  <td className={`py-1.5 px-2 text-right font-num ${l.contribution < 0 ? 'text-danger' : ''}`}>{signed(l.contribution)}</td>
                  <td className="py-1.5 px-2 text-text-secondary">{l.note ?? ''}</td>
                  <td className="py-1.5 px-2 font-num text-text-secondary">{fmt(l.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!logs.length && <p className="py-8 text-center text-caption text-text-tertiary">아직 내역이 없습니다.</p>}
        </div>
        {last > 1 && (
          <div className="flex items-center justify-center gap-2 text-caption">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>이전</Button>
            <span className="font-num text-text-secondary">{page} / {last}</span>
            <Button size="sm" variant="outline" disabled={page >= last} onClick={() => setPage(page + 1)}>다음</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

/** 엑셀에서 바로 열리는 CSV (BOM 포함). 맨 위에 시즌 명·방송 명 */
function downloadLogs(crew: CrewState) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    ['시즌 명', crew.season?.name ?? ''],
    ['방송 명', crew.title ?? ''],
    [],
    ['구분', '크루 명', '후원 점수', '기여도', '비고', '일시'],
    ...crew.logs.map((l: CrewLog) => [l.kind === 'donation' ? '후원' : '수동', l.name, l.score, l.contribution, l.note ?? '', fmt(l.at)]),
  ];
  const blob = new Blob(['﻿' + lines.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '점수기여도_전체내역.csv';
  // 문서에 붙여야 파일 이름(download 속성)이 적용된다
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
