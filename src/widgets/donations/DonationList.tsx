import { useEffect, useState } from 'react';
import { api } from '../../state/app';
import { useData, useWidth } from '../../lib/hooks';
import { useT } from '../../lib/i18n';
import type { ListTab } from '../../types';
import { Badge } from '../../components/ui';
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
  const compact = width > 0 && width < 560;

  // 보고 있는 탭은 확인한 것으로 처리 → 배지 off (p42 ⑤)
  useEffect(() => {
    if (unseen[tab] > 0) api.markSeen(tab);
  }, [tab, unseen]);

  return (
    <div ref={ref} className="h-full flex flex-col">
      {/* 세그먼트 컨트롤 (iOS 26: 높이 32, 선택 칸 흰색) */}
      <div className="px-3 pb-2 shrink-0">
        <div role="tablist" className="segmented h-8">
          {TABS.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={tab === x.id}
              onClick={() => { setTab(x.id); setSearching(false); }}
              className="relative text-[13px] flex items-center justify-center gap-1.5 text-black dark:text-white"
            >
              {t(x.label)}
              {tab !== x.id && <Badge count={unseen[x.id]} />}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-2 h-10 shrink-0 border-b border-black/10 dark:border-white/15">
        <div>{tab === 'all' && <FilterButton />}</div>
        {tab === 'draw' ? <DrawToolbar searching={searching} onSearchChange={setSearching} /> : <SortButton />}
      </div>
      <div className="flex-1 min-h-0">
        {tab === 'draw' ? <DrawTab compact={compact} searching={searching} /> : <AlertList tab={tab} compact={compact} />}
      </div>
    </div>
  );
}
