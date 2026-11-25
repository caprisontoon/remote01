import { useEffect, useState } from 'react';
import { api } from '../../state/app';
import { useData, useSettings, useWidth } from '../../lib/hooks';
import { useT } from '../../lib/i18n';
import type { ListTab } from '../../types';
import { Badge } from '../../components/ui';
import { WidgetHeader } from '../../shell/WidgetFrame';
import { AlertList } from './AlertList';
import { DrawTab, DrawToolbar } from './DrawTab';
import { FilterButton, SortButton } from './parts';

const TABS: { id: ListTab; label: string }[] = [
  { id: 'all', label: '통합 알림' },
  { id: 'game', label: '게임' },
  { id: 'draw', label: '뽑기' },
];

/** 후원 리스트 위젯 (p37~59). 닫기·압정·분리가 없는 고정 위젯이다. */
export default function DonationList() {
  const t = useT();
  const [tab, setTab] = useState<ListTab>('all');
  const [searching, setSearching] = useState(false);
  const unseen = useData((d) => d.unseen);
  const [ref, width] = useWidth<HTMLDivElement>();
  const scale = useSettings((s) => s.textScale) / 100;
  // 표 → 카드 전환 폭. 절반 폭(약 640px)에서도 표를 유지하고, 그보다 좁을 때만 카드로 바꾼다. 글자 크기에 비례해 넓힌다
  const compact = width > 0 && width < 520 * scale;
  // 중간 폭: 표는 유지하되 종류·닉네임 칸 기본 폭을 줄여 내용 칸을 남긴다
  const dense = width > 0 && width < 900 * scale;
  // 뽑기 탭은 칸이 하나 더 많아 640px부터 카드로 바꾼다
  const drawCompact = width > 0 && width < 640 * scale;
  // 좁으면 헤더 버튼은 아이콘만 남긴다 (텍스트 크기 125·150%에서도 탭이 잘리지 않게)
  const narrow = width > 0 && width < 640 * scale;

  // 보고 있는 탭은 확인한 것으로 처리 → 배지 off (p42 ⑤)
  useEffect(() => {
    if (unseen[tab] > 0) api.markSeen(tab);
  }, [tab, unseen]);

  return (
    <div ref={ref} className="h-full flex flex-col">
      {/* 탭(밑줄형)·필터·정렬은 위젯 제목과 같은 줄에 둔다 */}
      <WidgetHeader>
        <div role="tablist" className="flex items-stretch min-w-0 overflow-x-auto [scrollbar-width:none]">
          {TABS.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={tab === x.id}
              onClick={() => { setTab(x.id); setSearching(false); }}
              className={`relative px-3 flex items-center gap-1.5 whitespace-nowrap text-body border-b-2 -mb-px transition-colors ${
                tab === x.id ? 'border-live text-text font-semibold' : 'border-transparent text-text-secondary hover:text-text'
              }`}
            >
              {t(x.label)}
              {tab !== x.id && <Badge count={unseen[x.id]} />}
            </button>
          ))}
        </div>
        <div className="ml-auto self-center flex items-center gap-1.5">
          {tab === 'all' && <FilterButton iconOnly={narrow} />}
          {tab === 'draw' ? <DrawToolbar searching={searching} onSearchChange={setSearching} iconOnly={narrow} /> : <SortButton iconOnly={narrow} />}
        </div>
      </WidgetHeader>
      <div className="flex-1 min-h-0">
        {tab === 'draw' ? <DrawTab compact={drawCompact} searching={searching} /> : <AlertList tab={tab} compact={compact} dense={dense} />}
      </div>
    </div>
  );
}
