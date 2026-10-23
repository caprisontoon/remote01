import type { ReleaseStatus } from '../../api/admin';
import { BarList } from '../charts';
import { admin } from '../backend';
import { go } from '../route';
import { Card, PageHeader, Pill, StatTile, num, pct, tdClass, thClass, useAsync } from '../ui';

const STATUS: Record<ReleaseStatus, { label: string; tone: 'brand' | 'neutral' | 'danger' }> = {
  latest: { label: '최신', tone: 'brand' },
  supported: { label: '지원', tone: 'neutral' },
  deprecated: { label: '지원 종료', tone: 'danger' },
};

const ymd = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

/** 버전 현황: 설치형 회원이 마지막으로 접속한 버전 분포 */
export function VersionsPage() {
  const { data } = useAsync(() => admin.versionStats(), []);
  if (!data) return <PageHeader title="버전 현황" />;
  const latest = data.rows.find((r) => r.status === 'latest');
  const outdated = data.total - (latest?.users ?? 0);
  const deprecated = data.rows.filter((r) => r.status === 'deprecated').reduce((s, r) => s + r.users, 0);

  return (
    <>
      <PageHeader title="버전 현황" desc="설치형 회원이 마지막으로 접속한 버전 기준입니다." />
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="최신 버전" value={`v${data.latest}`} sub={latest ? `${ymd(latest.releasedAt)} 배포` : undefined} />
          <StatTile label="최신 버전 이용률" value={pct(latest?.users ?? 0, data.total)} sub={`${num(latest?.users ?? 0)}명 / ${num(data.total)}명`} />
          <StatTile label="업데이트가 필요한 이용자" value={num(outdated)} sub="최신이 아닌 버전" />
          <StatTile label="지원 종료 버전 이용자" value={num(deprecated)} sub={data.rows.filter((r) => r.status === 'deprecated').map((r) => `v${r.version}`).join(' · ')} />
        </div>

        <Card title="버전별 이용자" pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr>
                  <th className={thClass}>버전</th>
                  <th className={thClass}>상태</th>
                  <th className={thClass}>배포일</th>
                  <th className={`${thClass} text-right`}>이용자</th>
                  <th className={`${thClass} text-right`}>비율</th>
                  <th className={`${thClass} text-right`}>Windows</th>
                  <th className={`${thClass} text-right`}>macOS</th>
                  <th className={`${thClass} text-right`}>회원</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.version} className="hover:bg-surface-sunken">
                    <td className={`${tdClass} font-num font-semibold`}>v{r.version}</td>
                    <td className={tdClass}><Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill></td>
                    <td className={`${tdClass} font-num text-text-secondary`}>{ymd(r.releasedAt)}</td>
                    <td className={`${tdClass} text-right font-num tabular-nums font-semibold`}>{num(r.users)}</td>
                    <td className={`${tdClass} text-right font-num tabular-nums`}>{pct(r.users, data.total)}</td>
                    <td className={`${tdClass} text-right font-num tabular-nums text-text-secondary`}>{num(r.windows)}</td>
                    <td className={`${tdClass} text-right font-num tabular-nums text-text-secondary`}>{num(r.mac)}</td>
                    <td className={`${tdClass} text-right`}>
                      <button type="button" className="text-caption text-link hover:underline" onClick={() => go('members', `version=${r.version}`)}>
                        목록 보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="버전 비율">
          <BarList rows={data.rows.map((r) => ({ label: `v${r.version}`, sub: STATUS[r.status].label, value: r.users }))} total={data.total} />
        </Card>
      </div>
    </>
  );
}
