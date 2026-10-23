// 회원 상세 패널 + 이용 정지·해제 창. 회원 관리와 제재 내역이 함께 쓴다.
import { AlertTriangle, Ban } from 'lucide-react';
import { useState } from 'react';
import type { MemberDetail } from '../../api/admin';
import {
  CLIENT_LABEL,
  SANCTION_REASON_LABEL,
  SANCTION_STATUS_LABEL,
  formatDateTime,
  sanctionStatus,
  type Sanction,
  type SanctionReason,
} from '../../api/server';
import { Button, Segmented, fieldClass } from '../../components/primitives';
import { SuspendedView } from '../../components/StatusScreens';
import { admin } from '../backend';
import { ConfirmDialog, Dialog, Drawer, FieldRow, Pill, ago, maskEmail, num, tdClass, textareaClass, thClass, toast, useAsync } from '../ui';

export function untilText(s: Pick<Sanction, 'start' | 'until'>) {
  return s.until === null ? `${formatDateTime(s.start, false)} ~ 영구` : `${formatDateTime(s.start, false)} ~ ${formatDateTime(s.until, false)}`;
}

export function SanctionPill({ s }: { s: Sanction }) {
  const st = sanctionStatus(s, Date.now());
  return <Pill tone={st === 'active' ? 'danger' : 'neutral'}>{SANCTION_STATUS_LABEL[st]}</Pill>;
}

/** 회원 상세: 기본 정보 · 의심 신호 · 정지 상태 · 최근 접속 · 제재 이력 */
export function MemberDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { data, reload } = useAsync(() => admin.getMember(id), [id]);
  const [sanctionOpen, setSanctionOpen] = useState(false);
  const [lifting, setLifting] = useState<Sanction | null>(null);
  const changed = () => {
    reload();
    onChanged();
  };

  if (!data) return <Drawer title="회원 정보" onClose={onClose}><p className="p-5 text-body text-text-tertiary">불러오는 중…</p></Drawer>;
  const { member: m, logs, sanctions } = data;

  return (
    <Drawer
      title={
        <span className="flex items-center gap-2">
          {m.nickname}
          {m.sanction ? <Pill tone="danger">정지 중</Pill> : m.suspicion ? <Pill tone="warning">의심</Pill> : null}
        </span>
      }
      onClose={onClose}
      footer={
        <Button variant="danger" onClick={() => setSanctionOpen(true)}>
          <span className="inline-flex items-center gap-1.5"><Ban size={14} />{m.sanction ? '정지 변경' : '이용 정지'}</span>
        </Button>
      }
    >
      <div className="p-5 flex flex-col gap-5">
        {m.sanction && (
          <div className="rounded-card border border-danger/40 bg-danger/[0.04] p-4">
            <p className="text-body font-bold text-danger">리모컨 이용 정지 중</p>
            <dl className="mt-2 grid grid-cols-[64px_1fr] gap-y-1 text-body">
              <dt className="text-text-secondary">사유</dt>
              <dd>{SANCTION_REASON_LABEL[m.sanction.reason]}</dd>
              <dt className="text-text-secondary">기간</dt>
              <dd className="font-num">{untilText(m.sanction)}</dd>
              <dt className="text-text-secondary">메모</dt>
              <dd className="whitespace-pre-line">{m.sanction.memo}</dd>
            </dl>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setLifting(m.sanction!)}>정지 해제</Button>
          </div>
        )}
        {m.suspicion && !m.sanction && (
          <div className="rounded-card border border-warning/40 bg-warning/15 p-4 flex gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-warning-text mt-0.5" />
            <div className="min-w-0">
              <p className="text-body font-bold text-warning-text">어뷰징 의심: {SANCTION_REASON_LABEL[m.suspicion.signal]}</p>
              <p className="mt-0.5 text-body text-text-body">{m.suspicion.detail}</p>
              <p className="mt-0.5 text-caption text-text-secondary">{formatDateTime(m.suspicion.detectedAt)} 감지</p>
            </div>
          </div>
        )}

        <dl className="grid grid-cols-[96px_1fr] gap-y-2 text-body">
          <dt className="text-text-secondary">회원 번호</dt>
          <dd className="font-num">{m.id}</dd>
          <dt className="text-text-secondary">투네이션 ID</dt>
          <dd className="font-num">{m.toonationId}</dd>
          <dt className="text-text-secondary">이메일</dt>
          <dd className="font-num">{maskEmail(m.email)}</dd>
          <dt className="text-text-secondary">로그인</dt>
          <dd>{m.loginMethod}</dd>
          <dt className="text-text-secondary">이용 환경</dt>
          <dd className="flex flex-wrap gap-1">{m.clients.map((c) => <Pill key={c}>{CLIENT_LABEL[c]}</Pill>)}</dd>
          <dt className="text-text-secondary">설치형</dt>
          <dd>{m.appVersion ? <span className="font-num">v{m.appVersion} · {m.os}{m.desktopSince && <span className="ml-1.5 text-caption text-text-tertiary">{formatDateTime(m.desktopSince, false).slice(0, 10)}부터</span>}</span> : <span className="text-text-tertiary">사용 안 함</span>}</dd>
          <dt className="text-text-secondary">가입일</dt>
          <dd className="font-num">{formatDateTime(m.joinedAt, false).slice(0, 10)}</dd>
          <dt className="text-text-secondary">마지막 접속</dt>
          <dd>
            {m.online ? <span className="font-semibold text-link">접속 중</span> : <span className="font-num">{formatDateTime(m.lastSeenAt, false)}</span>}
            <span className="ml-1.5 text-caption text-text-tertiary">{ago(m.lastSeenAt)}</span>
          </dd>
        </dl>

        <section>
          <h3 className="text-caption font-bold text-text-secondary mb-2">최근 접속 기록</h3>
          <div className="rounded-card border border-line overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr>
                  <th className={thClass}>일시</th>
                  <th className={thClass}>환경</th>
                  <th className={thClass}>IP</th>
                  <th className={`${thClass} text-right`}>분당 요청</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.at}>
                    <td className={`${tdClass} font-num`}>{formatDateTime(l.at, false).slice(5)}</td>
                    <td className={tdClass}>
                      {CLIENT_LABEL[l.client]}
                      <span className="ml-1 text-caption text-text-tertiary">{l.version ? `v${l.version} · ${l.os}` : l.os}</span>
                    </td>
                    <td className={`${tdClass} font-num text-text-secondary`}>{l.ip}</td>
                    {/* 평소(수십 회)보다 크게 많은 요청은 강조 */}
                    <td className={`${tdClass} text-right font-num tabular-nums ${l.requestsPerMin >= 300 ? 'text-danger font-semibold' : ''}`}>{num(l.requestsPerMin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-caption font-bold text-text-secondary mb-2">제재 이력</h3>
          {sanctions.length === 0 ? (
            <p className="text-body text-text-tertiary">제재 이력이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sanctions.map((s) => (
                <li key={s.id} className="rounded-card border border-line p-3">
                  <div className="flex items-center gap-2">
                    <SanctionPill s={s} />
                    <span className="text-body font-semibold">{SANCTION_REASON_LABEL[s.reason]}</span>
                  </div>
                  <p className="mt-1 text-caption text-text-secondary font-num">{untilText(s)} · {s.createdBy}</p>
                  {s.memo && <p className="mt-1 text-body text-text-body whitespace-pre-line">{s.memo}</p>}
                  {s.liftedAt && (
                    <p className="mt-1 text-caption text-text-secondary">
                      {formatDateTime(s.liftedAt, false)} 해제 · {s.liftedBy}
                      {s.liftMemo ? ` · ${s.liftMemo}` : ''}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {sanctionOpen && (
        <SanctionDialog
          detail={data}
          onClose={() => setSanctionOpen(false)}
          onDone={() => {
            setSanctionOpen(false);
            changed();
          }}
        />
      )}
      {lifting && (
        <LiftDialog
          sanction={lifting}
          nickname={m.nickname}
          onClose={() => setLifting(null)}
          onDone={() => {
            setLifting(null);
            changed();
          }}
        />
      )}
    </Drawer>
  );
}

const PERIODS: { value: string; label: string; days: number | null }[] = [
  { value: '1', label: '1일', days: 1 },
  { value: '3', label: '3일', days: 3 },
  { value: '7', label: '7일', days: 7 },
  { value: '30', label: '30일', days: 30 },
  { value: 'forever', label: '영구', days: null },
];

/** 이용 정지: 사유 · 기간 · 운영 메모 → 확인 창 → 정지. 이용자에게 보이는 화면을 미리 보여 준다. */
function SanctionDialog({ detail, onClose, onDone }: { detail: MemberDetail; onClose: () => void; onDone: () => void }) {
  const m = detail.member;
  const [reason, setReason] = useState<SanctionReason>(m.suspicion?.signal ?? 'request_flood');
  const [period, setPeriod] = useState('7');
  const [memo, setMemo] = useState(m.suspicion ? `${m.suspicion.detail}` : '');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const days = PERIODS.find((p) => p.value === period)!.days;
  const now = Date.now();

  const submit = async () => {
    setBusy(true);
    await admin.sanction({ memberId: m.id, reason, memo, days });
    setBusy(false);
    toast(`${m.nickname} 님의 리모컨 이용을 정지했습니다.`);
    onDone();
  };

  return (
    <Dialog
      title={`이용 정지 · ${m.nickname}`}
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button variant="danger" disabled={!memo.trim() || busy} onClick={() => setConfirm(true)}>이용 정지</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-5">
        <div className="divide-y divide-line-subtle">
          <FieldRow label="사유" required>
            <select value={reason} onChange={(e) => setReason(e.target.value as SanctionReason)} className={`${fieldClass} w-full`}>
              {(Object.keys(SANCTION_REASON_LABEL) as SanctionReason[]).map((r) => (
                <option key={r} value={r}>{SANCTION_REASON_LABEL[r]}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="기간" required hint={days === null ? '해제하기 전까지 계속 정지됩니다.' : `${formatDateTime(now + days * 86_400_000)}에 자동으로 풀립니다.`}>
            <Segmented value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p.value, label: p.label }))} />
          </FieldRow>
          <FieldRow label="운영 메모" required hint="운영자만 봅니다. 확인한 로그와 판단 근거를 남겨 주세요.">
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={4} className={textareaClass} placeholder="예: 분당 요청 1,200회가 30분간 이어짐. 로그 확인." />
          </FieldRow>
          {m.sanction && (
            <p className="pt-2.5 text-caption text-warning-text">지금 걸린 정지({untilText(m.sanction)})는 해제되고 새 정지로 바뀝니다.</p>
          )}
        </div>
        <div>
          <p className="text-caption font-bold text-text-secondary mb-2">이용자에게 보이는 화면</p>
          <div className="rounded-card border border-line bg-canvas p-4 flex justify-center origin-top [zoom:0.8]">
            <SuspendedView info={{ reason, start: now, until: days === null ? null : now + days * 86_400_000 }} />
          </div>
        </div>
      </div>
      {confirm && (
        <ConfirmDialog
          danger
          message={`${m.nickname} 님의 리모컨 이용을 정지하시겠습니까?`}
          note={'정지하면 접속 중인 리모컨(설치형·PC 웹·모바일 웹)이\n바로 이용 정지 화면으로 바뀝니다.'}
          confirmLabel="이용 정지"
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            setConfirm(false);
            void submit();
          }}
        />
      )}
    </Dialog>
  );
}

/** 정지 해제: 해제 사유를 남긴다 */
export function LiftDialog({ sanction, nickname, onClose, onDone }: { sanction: Sanction; nickname: string; onClose: () => void; onDone: () => void }) {
  const [memo, setMemo] = useState('');
  const submit = async () => {
    await admin.liftSanction(sanction.id, memo);
    toast(`${nickname} 님의 이용 정지를 해제했습니다.`);
    onDone();
  };
  return (
    <Dialog
      title={`정지 해제 · ${nickname}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button disabled={!memo.trim()} onClick={() => void submit()}>정지 해제</Button>
        </>
      }
    >
      <p className="text-body text-text-secondary">
        {SANCTION_REASON_LABEL[sanction.reason]} · <span className="font-num">{untilText(sanction)}</span>
      </p>
      <FieldRow label="해제 사유" required hint="해제하면 리모컨을 바로 다시 쓸 수 있습니다.">
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} className={textareaClass} placeholder="예: 이용자 소명 확인 (공용 PC 사용)" />
      </FieldRow>
    </Dialog>
  );
}
