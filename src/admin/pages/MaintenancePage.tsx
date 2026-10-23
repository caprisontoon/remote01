import { CalendarClock, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CLIENT_LABEL,
  DEFAULT_MAINTENANCE_MESSAGE,
  MAINTENANCE_STATUS_LABEL,
  formatRange,
  maintenanceStatus,
  validateMaintenance,
  type Client,
  type Maintenance,
  type MaintenanceInput,
} from '../../api/server';
import { Button, fieldClass } from '../../components/primitives';
import { MaintenanceView } from '../../components/StatusScreens';
import { admin } from '../backend';
import { Card, ConfirmDialog, FieldRow, PageHeader, Pill, tdClass, textareaClass, thClass, toast, useAsync } from '../ui';

const CLIENTS: Client[] = ['desktop', 'web', 'mobile'];
const LEADS = [
  { value: 0, label: '예고 안 함' },
  { value: 30, label: '30분 전부터' },
  { value: 60, label: '1시간 전부터' },
  { value: 180, label: '3시간 전부터' },
  { value: 1440, label: '24시간 전부터' },
];
const HOUR = 3_600_000;

const pad = (n: number) => String(n).padStart(2, '0');
/** <input type="datetime-local"> 값 (이 컴퓨터 시간대) */
const toLocal = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocal = (s: string) => (s ? new Date(s).getTime() : NaN);

/** 남은 시간: 1시간 23분 · 4분 · 2일 3시간 */
function remain(ms: number) {
  const m = Math.max(0, Math.ceil(ms / 60_000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  if (d) return `${d}일 ${h}시간`;
  if (h) return `${h}시간 ${mm}분`;
  return `${mm}분`;
}

interface Form {
  start: string;
  end: string;
  targets: Client[];
  message: string;
  noticeUrl: string;
  lead: number;
}

/** 기본값: 내일 새벽 2시 ~ 6시, 모든 환경, 24시간 전 예고 */
function defaultForm(): Form {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(2, 0, 0, 0);
  return { start: toLocal(d.getTime()), end: toLocal(d.getTime() + 4 * HOUR), targets: [...CLIENTS], message: DEFAULT_MAINTENANCE_MESSAGE, noticeUrl: '', lead: 1440 };
}

const toInput = (f: Form): MaintenanceInput => ({ start: fromLocal(f.start), end: fromLocal(f.end), targets: f.targets, message: f.message, noticeUrl: f.noticeUrl.trim() || undefined, noticeLeadMinutes: f.lead });

const STATUS_TONE = { scheduled: 'brand', active: 'warning', done: 'neutral', cancelled: 'neutral' } as const;

/** 점검 일정: 점검 일시를 정하면 그 시간 동안 대상 환경의 리모컨에 점검 화면이 뜬다 */
export function MaintenancePage() {
  const { data, reload } = useAsync(() => admin.listMaintenances(), []);
  const [now, setNow] = useState(Date.now);
  const [form, setForm] = useState<Form>(defaultForm);
  const [editing, setEditing] = useState<Maintenance | null>(null);
  const [tried, setTried] = useState(false);
  const [confirm, setConfirm] = useState<null | { kind: 'save' | 'startNow' | 'end' | 'cancel'; item?: Maintenance }>(null);

  // 상태(예정 → 진행 중 → 종료)와 남은 시간을 갱신한다. 목록을 새로 받으면 바로 다시 계산한다
  useEffect(() => setNow(Date.now()), [data]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const list = data ?? [];
  const errors = validateMaintenance(toInput(form), list, now, editing?.id);
  const active = list.filter((m) => maintenanceStatus(m, now) === 'active').sort((a, b) => a.end - b.end)[0];
  const next = list.filter((m) => maintenanceStatus(m, now) === 'scheduled').sort((a, b) => a.start - b.start)[0];
  const set = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));

  const resetForm = () => {
    setForm(defaultForm());
    setEditing(null);
    setTried(false);
  };

  const save = async (input: MaintenanceInput) => {
    const res = await admin.saveMaintenance(input, editing?.id);
    if (!res.ok) return toast(res.errors[0], 'error');
    toast(editing ? '점검 일정을 수정했습니다.' : maintenanceStatus(res.item, Date.now()) === 'active' ? '점검을 시작했습니다.' : '점검을 예약했습니다.');
    resetForm();
    reload();
  };

  const onSubmit = () => {
    setTried(true);
    if (errors.length) return;
    // 시작 시각이 이미 지났으면 저장 즉시 점검이 시작되므로 한 번 더 묻는다
    if (fromLocal(form.start) <= Date.now()) setConfirm({ kind: 'save' });
    else void save(toInput(form));
  };

  const onStartNow = () => {
    setTried(true);
    const input = { ...toInput(form), start: Date.now() };
    const errs = validateMaintenance(input, list, Date.now(), editing?.id);
    if (errs.length) return toast(errs[0], 'error');
    setConfirm({ kind: 'startNow' });
  };

  const edit = (m: Maintenance) => {
    setEditing(m);
    setTried(false);
    setForm({ start: toLocal(m.start), end: toLocal(m.end), targets: m.targets, message: m.message, noticeUrl: m.noticeUrl ?? '', lead: m.noticeLeadMinutes });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startTime = fromLocal(form.start);
  const endTime = fromLocal(form.end);

  return (
    <>
      <PageHeader title="점검 일정" desc="점검 시간 동안 고른 이용 환경의 리모컨에 점검 화면이 뜹니다. 점검이 끝나면 리모컨이 자동으로 돌아옵니다." />

      {/* 지금 상태 */}
      {active ? (
        <div className="mb-4 rounded-widget border border-warning/40 bg-warning/15 px-4 py-3.5 flex flex-wrap items-center gap-3">
          <Wrench size={20} className="text-warning-text shrink-0" />
          <div className="min-w-0">
            <p className="text-body font-bold text-warning-text">지금 점검 중 · {remain(active.end - now)} 남음</p>
            <p className="mt-0.5 text-body text-text-body">
              <span className="font-num">{formatRange(active.start, active.end)}</span> · {active.targets.map((t) => CLIENT_LABEL[t]).join(', ')}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" onClick={() => edit(active)}>종료 시간 변경</Button>
            <Button variant="danger" onClick={() => setConfirm({ kind: 'end', item: active })}>지금 종료</Button>
          </div>
        </div>
      ) : next ? (
        <div className="mb-4 rounded-widget border border-brand-tint-line bg-brand-tint px-4 py-3.5 flex flex-wrap items-center gap-3">
          <CalendarClock size={20} className="text-brand-hover dark:text-link shrink-0" />
          <div className="min-w-0">
            <p className="text-body font-bold text-brand-hover dark:text-link">다음 점검까지 {remain(next.start - now)}</p>
            <p className="mt-0.5 text-body text-text-body">
              <span className="font-num">{formatRange(next.start, next.end)}</span> · {next.targets.map((t) => CLIENT_LABEL[t]).join(', ')}
              {next.noticeLeadMinutes > 0 && <span className="text-text-secondary"> · 리모컨 공지 바 예고 {LEADS.find((l) => l.value === next.noticeLeadMinutes)?.label ?? `${next.noticeLeadMinutes}분 전부터`}</span>}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-widget border border-line bg-surface px-4 py-3.5 text-body text-text-secondary">예정된 점검이 없습니다.</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 mb-4">
        <Card title={editing ? '점검 일정 수정' : '점검 일정 등록'} right={editing && <Button variant="outline" size="sm" onClick={resetForm}>수정 취소</Button>}>
          <div className="divide-y divide-line-subtle -my-2.5">
            <FieldRow label="시작 일시" required>
              <input type="datetime-local" value={form.start} onChange={(e) => set({ start: e.target.value })} className={`${fieldClass} h-[34px] w-[220px] font-num`} />
            </FieldRow>
            <FieldRow label="종료 일시" required hint={Number.isFinite(startTime) && endTime > startTime ? `점검 시간 ${remain(endTime - startTime)}` : undefined}>
              <div className="flex flex-wrap items-center gap-2">
                <input type="datetime-local" value={form.end} onChange={(e) => set({ end: e.target.value })} className={`${fieldClass} h-[34px] w-[220px] font-num`} />
                {[1, 2, 4].map((h) => (
                  <Button key={h} variant="outline" size="sm" disabled={!Number.isFinite(startTime)} onClick={() => set({ end: toLocal(startTime + h * HOUR) })}>
                    {h}시간
                  </Button>
                ))}
              </div>
            </FieldRow>
            <FieldRow label="점검 대상" required hint="고른 이용 환경에만 점검 화면이 뜹니다.">
              <div className="flex flex-wrap gap-4 pt-1.5">
                {CLIENTS.map((c) => (
                  <label key={c} className="flex items-center gap-1.5 text-body cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-brand w-4 h-4"
                      checked={form.targets.includes(c)}
                      onChange={(e) => set({ targets: e.target.checked ? CLIENTS.filter((x) => x === c || form.targets.includes(x)) : form.targets.filter((x) => x !== c) })}
                    />
                    {CLIENT_LABEL[c]}
                  </label>
                ))}
              </div>
            </FieldRow>
            <FieldRow label="안내 문구" required hint="점검 화면에 그대로 나옵니다. 줄바꿈도 그대로 보입니다.">
              <textarea rows={3} value={form.message} onChange={(e) => set({ message: e.target.value })} className={textareaClass} />
            </FieldRow>
            <FieldRow label="점검 공지 링크" hint="넣으면 점검 화면에 [점검 공지] 버튼이 생깁니다.">
              <input value={form.noticeUrl} onChange={(e) => set({ noticeUrl: e.target.value })} placeholder="https://help.toon.at/hc/ko/articles/..." className={`${fieldClass} h-[34px] w-full`} />
            </FieldRow>
            <FieldRow label="사전 예고" hint="점검 전에 리모컨 상단 공지 바에 [점검 예정] 문구를 띄웁니다.">
              <select value={form.lead} onChange={(e) => set({ lead: Number(e.target.value) })} className={`${fieldClass} h-[34px] w-[220px]`}>
                {LEADS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </FieldRow>
          </div>

          {tried && errors.length > 0 && (
            <ul className="mt-4 rounded-card border border-danger/40 bg-danger/[0.04] px-4 py-3 text-body text-danger list-disc list-inside">
              {errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}

          <div className="mt-4 pt-4 border-t border-line flex flex-wrap justify-end gap-2">
            {!editing && (
              <Button variant="outline" onClick={onStartNow}>지금 바로 시작</Button>
            )}
            <Button onClick={onSubmit}>{editing ? '수정 저장' : '점검 예약'}</Button>
          </div>
        </Card>

        <Card title="리모컨 점검 화면 미리 보기">
          <div className="rounded-card border border-line bg-canvas min-h-[360px] flex items-center justify-center p-5">
            <MaintenanceView info={{ start: Number.isFinite(startTime) ? startTime : Date.now(), end: Number.isFinite(endTime) ? endTime : Date.now(), message: form.message || ' ', noticeUrl: form.noticeUrl.trim() || undefined }} />
          </div>
        </Card>
      </div>

      <Card title="점검 기록" pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead>
              <tr>
                <th className={thClass}>상태</th>
                <th className={thClass}>점검 시간</th>
                <th className={thClass}>대상</th>
                <th className={thClass}>안내 문구</th>
                <th className={thClass}>등록</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {list.map((m) => {
                const st = maintenanceStatus(m, now);
                return (
                  <tr key={m.id} className={editing?.id === m.id ? 'bg-brand-tint' : ''}>
                    <td className={tdClass}>
                      <Pill tone={STATUS_TONE[st]}>{MAINTENANCE_STATUS_LABEL[st]}</Pill>
                      {m.endedEarlyAt && <span className="ml-1 text-caption text-text-tertiary">조기 종료</span>}
                    </td>
                    <td className={`${tdClass} font-num`}>{formatRange(m.start, m.end)}</td>
                    <td className={tdClass}>{m.targets.map((t) => CLIENT_LABEL[t]).join(', ')}</td>
                    <td className={`${tdClass} max-w-[280px] truncate text-text-secondary`} title={m.message}>{m.message.replace(/\n/g, ' ')}</td>
                    <td className={`${tdClass} text-text-secondary`}>{m.createdBy}</td>
                    <td className={`${tdClass} text-right`}>
                      <span className="inline-flex gap-3">
                        {(st === 'scheduled' || st === 'active') && (
                          <button type="button" className="text-caption text-link hover:underline" onClick={() => edit(m)}>수정</button>
                        )}
                        {st === 'scheduled' && (
                          <button type="button" className="text-caption text-danger hover:underline" onClick={() => setConfirm({ kind: 'cancel', item: m })}>예약 취소</button>
                        )}
                        {st === 'active' && (
                          <button type="button" className="text-caption text-danger hover:underline" onClick={() => setConfirm({ kind: 'end', item: m })}>지금 종료</button>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data && list.length === 0 && <p className="py-12 text-center text-body text-text-tertiary">점검 기록이 없습니다.</p>}
        </div>
      </Card>

      {confirm?.kind === 'save' && (
        <ConfirmDialog
          danger
          message="저장하면 바로 점검이 시작됩니다."
          note={`시작 일시가 이미 지났습니다.\n${form.targets.map((t) => CLIENT_LABEL[t]).join(', ')} 리모컨이 바로 점검 화면으로 바뀝니다.`}
          confirmLabel="점검 시작"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            void save(toInput(form));
          }}
        />
      )}
      {confirm?.kind === 'startNow' && (
        <ConfirmDialog
          danger
          message="지금 점검을 시작하시겠습니까?"
          note={`${form.targets.map((t) => CLIENT_LABEL[t]).join(', ')} 리모컨이 바로 점검 화면으로 바뀝니다.\n종료: ${Number.isFinite(endTime) ? formatRange(Date.now(), endTime).split(' ~ ')[1] : '-'}`}
          confirmLabel="점검 시작"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            void save({ ...toInput(form), start: Date.now() });
          }}
        />
      )}
      {confirm?.kind === 'end' && confirm.item && (
        <ConfirmDialog
          message="점검을 지금 종료하시겠습니까?"
          note="리모컨의 점검 화면이 닫히고 바로 이용할 수 있게 됩니다."
          confirmLabel="점검 종료"
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            const id = confirm.item!.id;
            setConfirm(null);
            await admin.endMaintenanceNow(id);
            toast('점검을 종료했습니다.');
            if (editing?.id === id) resetForm();
            reload();
          }}
        />
      )}
      {confirm?.kind === 'cancel' && confirm.item && (
        <ConfirmDialog
          danger
          message="점검 예약을 취소하시겠습니까?"
          note={formatRange(confirm.item.start, confirm.item.end)}
          confirmLabel="예약 취소"
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            const id = confirm.item!.id;
            setConfirm(null);
            await admin.cancelMaintenance(id);
            toast('점검 예약을 취소했습니다.');
            if (editing?.id === id) resetForm();
            reload();
          }}
        />
      )}
    </>
  );
}
