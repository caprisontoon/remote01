import { useState } from 'react';
import { Segmented } from '../../components/primitives';
import { CLIENT_LABEL, type Client } from '../../api/server';
import { admin } from '../backend';
import { BarList, ColumnChart } from '../charts';
import { Card, PageHeader, StatTile, num, pct, tdClass, thClass, useAsync } from '../ui';

const RANGES = [7, 30, 90] as const;
const CLIENTS: Client[] = ['desktop', 'web', 'mobile'];

/** 설치형 이용자 현황: 누적·기간·접속 중 이용자, 일간 추이, 이용 환경·OS 분포 */
export function UsagePage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const [asTable, setAsTable] = useState(false);
  const { data, loading } = useAsync(() => admin.usageStats(range), [range]);

  return (
    <>
      <PageHeader
        title="설치형 이용자 현황"
        desc="설치형 리모컨 이용자 수와 이용 환경. 기간을 바꾸면 아래 숫자가 모두 같은 기간으로 바뀝니다."
        right={<Segmented value={range} onChange={setRange} options={RANGES.map((r) => ({ value: r, label: `최근 ${r}일` }))} className="w-[240px]" />}
      />
      {data && (
        <div className={`flex flex-col gap-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="설치형 이용자 (누적)" value={num(data.desktopMembers)} sub={`전체 회원 ${num(data.totalMembers)}명 중 ${pct(data.desktopMembers, data.totalMembers)}`} />
            <StatTile label={`최근 ${range}일 설치형 이용자`} value={num(data.active.desktop)} sub={`Windows ${num(data.desktopOs.Windows)} · macOS ${num(data.desktopOs.macOS)}`} />
            <StatTile label="지금 접속 중 (설치형)" value={num(data.online.desktop)} sub={`PC 웹 ${num(data.online.web)} · 모바일 웹 ${num(data.online.mobile)}`} />
            <StatTile label={`최근 ${range}일 신규 설치`} value={num(data.newDesktop)} sub="처음 설치형으로 접속한 회원" />
          </div>

          <Card
            title="설치형 일간 이용자"
            right={
              <button type="button" onClick={() => setAsTable((v) => !v)} className="text-caption text-link hover:underline">
                {asTable ? '차트로 보기' : '표로 보기'}
              </button>
            }
          >
            {asTable ? (
              <div className="max-h-[260px] overflow-auto">
                <table className="w-full text-body">
                  <thead className="sticky top-0">
                    <tr>
                      <th className={thClass}>날짜</th>
                      <th className={`${thClass} text-right`}>이용자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.daily].reverse().map((d) => (
                      <tr key={d.date}>
                        <td className={`${tdClass} font-num`}>{d.date}</td>
                        <td className={`${tdClass} text-right font-num tabular-nums`}>{num(d.users)}명</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ColumnChart data={data.daily} />
            )}
            <p className="mt-2 text-caption text-text-tertiary">오늘은 지금까지 접속한 이용자만 셉니다.</p>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title={`이용 환경별 이용자 (최근 ${range}일)`}>
              <BarList rows={CLIENTS.map((c) => ({ label: CLIENT_LABEL[c], value: data.active[c] }))} />
              <p className="mt-3 text-caption text-text-tertiary">한 회원이 여러 환경을 쓰면 환경마다 셉니다.</p>
            </Card>
            <Card title={`설치형 OS (최근 ${range}일)`}>
              <BarList rows={[{ label: 'Windows', value: data.desktopOs.Windows }, { label: 'macOS', value: data.desktopOs.macOS }]} />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
