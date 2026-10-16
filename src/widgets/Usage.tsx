import { api } from '../state/app';
import { useData } from '../lib/hooks';
import type { UsageKey } from '../types';
import { Toggle } from '../components/ui';

const ITEMS: { key: UsageKey; label: string }[] = [
  { key: 'text', label: '텍스트' },
  { key: 'mini', label: '미니' },
  { key: 'voice', label: '음성' },
  { key: 'video', label: '영상' },
  { key: 'roulette', label: '룰렛' },
  { key: 'quest', label: '퀘스트' },
  { key: 'drawing', label: '그림' },
  { key: 'gift', label: '기프트' },
  { key: 'luckybox', label: '럭키박스' },
  { key: 'play', label: '플레이' },
  { key: 'signature', label: '시그니처' },
  { key: 'game', label: '게임' },
  { key: 'crew', label: '크루' },
];

/** 후원 사용 (p69~70). 크리에이터 페이지 설정과 연동되며, 전체 OFF면 도네이터 페이지의 모든 후원 메뉴가 비활성화된다. */
export default function Usage() {
  const master = useData((d) => d.usageMaster);
  const usage = useData((d) => d.usage);
  const count = master ? ITEMS.filter((i) => usage[i.key]).length : 0;
  return (
    <div className="p-3">
      <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 mb-3 ${master ? 'bg-blue-50 dark:bg-blue-500/10' : 'bg-slate-100 dark:bg-white/5'}`}>
        <div>
          <div className="text-xs font-bold">{master ? '후원 기능 사용 중' : '후원 기능 사용 중지'}</div>
          <div className="text-[11px] text-slate-500">사용 중인 후원 : {count}개</div>
        </div>
        <Toggle on={master} onChange={api.setUsageMaster} label="후원 기능 사용" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
        {ITEMS.map((i) => (
          <div key={i.key} className={`rounded-2xl bg-[rgba(116,116,128,0.08)] dark:bg-[rgba(118,118,128,0.18)] p-2 flex flex-col items-center gap-1.5 ${master ? '' : 'opacity-50'}`}>
            <span className="text-xs font-bold">{i.label}</span>
            <Toggle size="sm" on={usage[i.key]} disabled={!master} onChange={(v) => api.setUsage(i.key, v)} label={i.label} />
          </div>
        ))}
      </div>
    </div>
  );
}
