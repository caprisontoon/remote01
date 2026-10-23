import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { MemberQuery, MemberSearchField, MemberStatusFilter } from '../../api/admin';
import { CLIENT_LABEL, type Client } from '../../api/server';
import { Button, fieldClass } from '../../components/primitives';
import { admin } from '../backend';
import { go } from '../route';
import { Card, PageHeader, Pagination, Pill, ago, maskEmail, num, tdClass, thClass, useAsync } from '../ui';
import { MemberDrawer } from './MemberDrawer';

const FIELDS: { value: MemberSearchField; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'nickname', label: '닉네임' },
  { value: 'toonationId', label: '투네이션 ID' },
  { value: 'email', label: '이메일' },
  { value: 'id', label: '회원 번호' },
];

const STATUS_TABS: { value: MemberStatusFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'normal', label: '정상' },
  { value: 'suspicious', label: '어뷰징 의심' },
  { value: 'suspended', label: '정지 중' },
];

const PAGE_SIZE = 20;

/** 주소 값: 회원 번호(M…)면 상세를 열고, version=…이면 그 버전으로 거른다 */
function fromParam(param?: string) {
  if (!param) return {};
  if (param.startsWith('version=')) return { version: param.slice(8) };
  return { openId: param };
}

/** 회원 관리: 검색 · 상태/환경/버전 필터 · 목록 · 상세(정지·해제) */
export function MembersPage({ openId: param }: { openId?: string }) {
  const initial = fromParam(param);
  const [field, setField] = useState<MemberSearchField>('all');
  const [input, setInput] = useState('');
  const [query, setQuery] = useState<MemberQuery>({
    field: 'all',
    keyword: '',
    status: 'all',
    client: 'all',
    version: initial.version ?? 'all',
    sort: 'lastSeen',
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const openId = fromParam(param).openId;
  const { data, loading, reload } = useAsync(() => admin.searchMembers(query), [query]);
  const versions = useAsync(() => admin.versionStats(), []).data?.rows ?? [];

  // 버전 현황에서 "목록 보기"로 들어오면 그 버전으로 거른다
  useEffect(() => {
    const v = fromParam(param).version;
    if (v) setQuery((q) => ({ ...q, version: v, page: 1 }));
  }, [param]);

  const patch = (p: Partial<MemberQuery>) => setQuery((q) => ({ ...q, page: 1, ...p }));

  return (
    <>
      <PageHeader title="회원 관리" desc="리모컨을 쓰는 회원을 찾고, 어뷰징이 확인된 회원의 리모컨 이용을 정지합니다." />

      <form
        className="flex flex-wrap items-center gap-2 mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          patch({ field, keyword: input });
        }}
      >
        <select aria-label="검색 항목" value={field} onChange={(e) => setField(e.target.value as MemberSearchField)} className={`${fieldClass} h-[34px] w-[120px]`}>
          {FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <div className="relative flex-1 min-w-[220px] max-w-[420px]">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="닉네임, 투네이션 ID, 이메일, 회원 번호" className={`${fieldClass} h-[34px] w-full pl-8`} />
        </div>
        <Button type="submit">검색</Button>
        {(query.keyword || query.client !== 'all' || query.version !== 'all') && (
          <Button
            variant="outline"
            onClick={() => {
              setInput('');
              setField('all');
              patch({ field: 'all', keyword: '', client: 'all', version: 'all' });
              if (param) go('members');
            }}
          >
            초기화
          </Button>
        )}
      </form>

      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-3 border-b border-line">
          <div role="tablist" aria-label="회원 상태" className="flex gap-1 -mb-px">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                role="tab"
                aria-selected={query.status === t.value}
                onClick={() => patch({ status: t.value })}
                className={`h-10 px-2.5 border-b-2 text-body whitespace-nowrap ${query.status === t.value ? 'border-live text-text font-semibold' : 'border-transparent text-text-secondary hover:text-text'}`}
              >
                {t.label}
                <span className="ml-1 font-num text-caption text-text-tertiary">{data ? num(data.counts[t.value]) : '-'}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 pb-2.5">
            <select aria-label="이용 환경" value={query.client} onChange={(e) => patch({ client: e.target.value as Client | 'all' })} className={fieldClass}>
              <option value="all">이용 환경 전체</option>
              {(Object.keys(CLIENT_LABEL) as Client[]).map((c) => <option key={c} value={c}>{CLIENT_LABEL[c]}</option>)}
            </select>
            <select aria-label="설치형 버전" value={query.version} onChange={(e) => patch({ version: e.target.value })} className={fieldClass}>
              <option value="all">버전 전체</option>
              {versions.map((r) => <option key={r.version} value={r.version}>v{r.version}</option>)}
            </select>
            <select aria-label="정렬" value={query.sort} onChange={(e) => patch({ sort: e.target.value as MemberQuery['sort'] })} className={fieldClass}>
              <option value="lastSeen">최근 접속 순</option>
              <option value="joined">최근 가입 순</option>
            </select>
          </div>
        </div>

        <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full text-body">
            <thead>
              <tr>
                <th className={thClass}>회원</th>
                <th className={thClass}>회원 번호</th>
                <th className={thClass}>이메일</th>
                <th className={thClass}>이용 환경</th>
                <th className={thClass}>설치형 버전</th>
                <th className={thClass}>마지막 접속</th>
                <th className={thClass}>상태</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((m) => (
                <tr
                  key={m.id}
                  tabIndex={0}
                  onClick={() => go('members', m.id)}
                  onKeyDown={(e) => e.key === 'Enter' && go('members', m.id)}
                  className="cursor-pointer hover:bg-surface-sunken focus-visible:bg-surface-sunken"
                >
                  <td className={tdClass}>
                    <span className="font-semibold">{m.nickname}</span>
                    <span className="ml-1.5 text-caption text-text-tertiary font-num">{m.toonationId}</span>
                  </td>
                  <td className={`${tdClass} font-num text-text-secondary`}>{m.id}</td>
                  <td className={`${tdClass} font-num text-text-secondary`}>{maskEmail(m.email)}</td>
                  <td className={tdClass}>
                    <span className="flex gap-1">{m.clients.map((c) => <Pill key={c}>{CLIENT_LABEL[c]}</Pill>)}</span>
                  </td>
                  <td className={`${tdClass} font-num`}>
                    {m.appVersion ? (
                      <>
                        v{m.appVersion}
                        <span className="ml-1 text-caption text-text-tertiary">{m.os}</span>
                      </>
                    ) : (
                      <span className="text-text-tertiary">-</span>
                    )}
                  </td>
                  <td className={tdClass}>{m.online ? <span className="font-semibold text-link">접속 중</span> : ago(m.lastSeenAt)}</td>
                  <td className={tdClass}>
                    {m.sanction ? <Pill tone="danger">정지 중</Pill> : m.suspicion ? <Pill tone="warning">의심</Pill> : <span className="text-text-secondary">정상</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.items.length === 0 && <p className="py-12 text-center text-body text-text-tertiary">조건에 맞는 회원이 없습니다.</p>}
        </div>
        {data && data.total > 0 && (
          <div className="flex items-center px-4 border-t border-line">
            <span className="text-caption text-text-secondary">총 <span className="font-num">{num(data.total)}</span>명</span>
            <div className="mx-auto">
              <Pagination page={query.page} total={data.total} pageSize={PAGE_SIZE} onChange={(page) => setQuery((q) => ({ ...q, page }))} />
            </div>
            <span className="w-16" />
          </div>
        )}
      </Card>

      {openId && <MemberDrawer id={openId} onClose={() => go('members')} onChanged={reload} />}
    </>
  );
}
