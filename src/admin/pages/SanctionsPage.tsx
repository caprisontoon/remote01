import { useState } from 'react';
import type { SanctionRow } from '../../api/admin';
import { SANCTION_REASON_LABEL, SANCTION_STATUS_LABEL, formatDateTime, sanctionStatus, type SanctionStatus } from '../../api/server';
import { fieldClass } from '../../components/primitives';
import { admin } from '../backend';
import { Card, PageHeader, num, tdClass, thClass, useAsync } from '../ui';
import { LiftDialog, MemberDrawer, SanctionPill, untilText } from './MemberDrawer';

const TABS: ('all' | SanctionStatus)[] = ['all', 'active', 'expired', 'lifted'];

/** 제재 내역: 모든 이용 정지 기록. 정지 중인 건은 바로 해제할 수 있다. */
export function SanctionsPage() {
  const { data, loading, reload } = useAsync(() => admin.listSanctions(), []);
  const [tab, setTab] = useState<'all' | SanctionStatus>('all');
  const [keyword, setKeyword] = useState('');
  const [member, setMember] = useState<string | null>(null);
  const [lifting, setLifting] = useState<SanctionRow | null>(null);
  const now = Date.now();

  const kw = keyword.trim().toLowerCase();
  const matched = (data ?? []).filter((s) => !kw || s.nickname.toLowerCase().includes(kw) || s.toonationId.toLowerCase().includes(kw) || s.memberId.toLowerCase().includes(kw));
  const count = (t: 'all' | SanctionStatus) => matched.filter((s) => t === 'all' || sanctionStatus(s, now) === t).length;
  const rows = matched.filter((s) => tab === 'all' || sanctionStatus(s, now) === tab);

  return (
    <>
      <PageHeader title="제재 내역" desc="관리자가 건 리모컨 이용 정지 기록입니다. 행을 누르면 회원 상세가 열립니다." />
      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-3 border-b border-line">
          <div role="tablist" aria-label="제재 상태" className="flex gap-1 -mb-px">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`h-10 px-2.5 border-b-2 text-body whitespace-nowrap ${tab === t ? 'border-live text-text font-semibold' : 'border-transparent text-text-secondary hover:text-text'}`}
              >
                {t === 'all' ? '전체' : SANCTION_STATUS_LABEL[t]}
                <span className="ml-1 font-num text-caption text-text-tertiary">{num(count(t))}</span>
              </button>
            ))}
          </div>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="닉네임, 투네이션 ID, 회원 번호"
            aria-label="회원 검색"
            className={`${fieldClass} ml-auto mb-2.5 w-[260px] max-w-full`}
          />
        </div>
        <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full text-body">
            <thead>
              <tr>
                <th className={thClass}>상태</th>
                <th className={thClass}>회원</th>
                <th className={thClass}>사유</th>
                <th className={thClass}>기간</th>
                <th className={thClass}>운영 메모</th>
                <th className={thClass}>처리</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} tabIndex={0} onClick={() => setMember(s.memberId)} onKeyDown={(e) => e.key === 'Enter' && setMember(s.memberId)} className="cursor-pointer hover:bg-surface-sunken">
                  <td className={tdClass}><SanctionPill s={s} /></td>
                  <td className={tdClass}>
                    <span className="font-semibold">{s.nickname}</span>
                    <span className="ml-1.5 text-caption text-text-tertiary font-num">{s.memberId}</span>
                  </td>
                  <td className={tdClass}>{SANCTION_REASON_LABEL[s.reason]}</td>
                  <td className={`${tdClass} font-num`}>{untilText(s)}</td>
                  <td className={`${tdClass} max-w-[200px] truncate text-text-secondary`} title={s.memo}>{s.memo}</td>
                  <td className={`${tdClass} text-text-secondary`}>
                    {s.createdBy}
                    <span className="ml-1 text-caption font-num">{formatDateTime(s.createdAt, false).slice(5, 10)}</span>
                  </td>
                  <td className={`${tdClass} text-right`}>
                    {sanctionStatus(s, now) === 'active' && (
                      <button
                        type="button"
                        className="text-caption text-link hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLifting(s);
                        }}
                      >
                        해제
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && rows.length === 0 && <p className="py-12 text-center text-body text-text-tertiary">제재 기록이 없습니다.</p>}
        </div>
      </Card>

      {member && <MemberDrawer id={member} onClose={() => setMember(null)} onChanged={reload} />}
      {lifting && (
        <LiftDialog
          sanction={lifting}
          nickname={lifting.nickname}
          onClose={() => setLifting(null)}
          onDone={() => {
            setLifting(null);
            reload();
          }}
        />
      )}
    </>
  );
}
