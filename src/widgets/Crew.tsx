import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { api } from '../state/app';
import { useData, useNow, mmss } from '../lib/hooks';
import { openUrl } from '../platform';
import type { CrewMember } from '../types';
import { Button, Cash, Confirm, Empty } from '../components/ui';

const SETTINGS_URL = 'https://toon.at/streamer/crew';
const fmt = (ms: number) => new Date(ms).toLocaleString('ko-KR', { hour12: false });

/** 크루 후원 (p79~80) */
export default function Crew() {
  const crew = useData((d) => d.crew);
  const now = useNow();
  const [confirm, setConfirm] = useState<'start' | 'end' | null>(null);

  if (crew.result) {
    const r = crew.result;
    return (
      <div className="h-full flex flex-col text-body">
        <div className="flex-1 overflow-auto p-3 space-y-3">
          <p className="text-center font-semibold text-text">방송이 종료 되었습니다.<br /><span className="text-text-secondary font-normal">방송 결과를 확인해 보세요.</span></p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-text-secondary whitespace-nowrap">방송명</dt><dd className="font-semibold text-text">{r.title}</dd>
            <dt className="text-text-secondary whitespace-nowrap">방송 시간</dt><dd className="tabular-nums text-text-body">{fmt(r.startedAt)} ~ {fmt(r.endedAt)} (총 {Math.round((r.endedAt - r.startedAt) / 60000)}분)</dd>
          </dl>
          <MemberTable members={r.ranking} ranked />
          <div className="rounded-card bg-surface-raised border border-line px-3 py-2 flex justify-between gap-2 font-semibold text-text"><span className="whitespace-nowrap">총 후원 캐시</span><span className="whitespace-nowrap"><Cash value={r.totalCash} /> 캐시</span></div>
        </div>
        <div className="p-2.5 border-t border-line"><Button className="w-full" onClick={api.closeCrewResult}>확인</Button></div>
      </div>
    );
  }

  if (!crew.season || !crew.title) {
    return (
      <Empty>
        <div className="space-y-2">
          <p>방송 설정이 필요합니다.</p>
          <button className="text-link font-semibold inline-flex items-center gap-1" onClick={() => openUrl(SETTINGS_URL)}>방송 설정 페이지 <ExternalLink size={12} /></button>
        </div>
      </Empty>
    );
  }

  const live = !!crew.liveSince;
  return (
    <div className="h-full flex flex-col text-body">
      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-caption text-text-secondary">시즌 명 · {crew.season}</div>
            <div className="text-title-widget text-text">{crew.title}</div>
          </div>
          {live ? (
            <span className="shrink-0 whitespace-nowrap px-2 py-0.5 rounded-tag bg-danger text-white text-micro font-bold">LIVE {mmss(now - crew.liveSince!)}</span>
          ) : (
            <button className="text-caption text-link font-semibold inline-flex items-center gap-1 shrink-0 whitespace-nowrap" onClick={() => openUrl(SETTINGS_URL)}>방송 설정 페이지 <ExternalLink size={11} /></button>
          )}
        </div>
        <div>
          <div className="font-semibold text-text mb-1">방송 참여 크루</div>
          {crew.members.length ? <MemberTable members={crew.members} /> : <Empty>{'등록된 크루원이 없습니다.\n크루원 설정을 통해 크루원을 추가해 주세요.'}</Empty>}
        </div>
      </div>
      <div className="p-2.5 border-t border-line">
        {live ? <Button variant="danger" className="w-full" onClick={() => setConfirm('end')}>방송 종료</Button> : <Button className="w-full" disabled={!crew.members.length} onClick={() => setConfirm('start')}>방송 시작</Button>}
      </div>
      {confirm === 'start' && <Confirm message={'방송 시작\n\n크루 방송을 시작 하시겠습니까?'} onConfirm={() => { api.startCrew(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
      {confirm === 'end' && <Confirm message={'방송 종료\n\n현재 방송을 종료 하시겠습니까?'} onConfirm={() => { api.endCrew(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

/** 가로가 좁으면 가로 스크롤 (p79 ⑤ 디자인 메모) */
function MemberTable({ members, ranked }: { members: CrewMember[]; ranked?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[300px] border-collapse text-caption whitespace-nowrap">
        <thead>
          <tr className="bg-surface-sunken text-text-secondary">
            {ranked && <th className="h-8 px-2 font-medium text-left">순위</th>}
            <th className="h-8 px-2 font-medium text-left">직급</th>
            <th className="h-8 px-2 font-medium text-left">크루 명</th>
            <th className="h-8 px-2 font-medium text-right">후원점수</th>
            <th className="h-8 px-2 font-medium text-right">기여도</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => (
            <tr key={m.name} className="border-b border-line-subtle text-text-body">
              {ranked && <td className="py-1.5 px-2 font-semibold text-text">{i + 1}</td>}
              <td className="py-1.5 px-2">{m.rank}</td>
              <td className="py-1.5 px-2 font-semibold text-text">{m.name}</td>
              <td className="py-1.5 px-2 text-right"><Cash value={m.score} /></td>
              <td className="py-1.5 px-2 text-right font-num">{m.contribution}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
