import { api } from '../state/app';
import { useData } from '../lib/hooks';
import type { AlertKey } from '../types';
import { Toggle } from '../components/ui';

const GROUPS: { title: string; items: { key: AlertKey; label: string }[] }[] = [
  { title: '투네 애드 알림', items: [{ key: 'toneAd', label: '투네 애드' }] },
  { title: '유튜브 알림', items: [{ key: 'ytSuperchat', label: '슈퍼쳇' }, { key: 'ytMembership', label: '멤버십' }] },
  { title: '치지직 알림', items: [{ key: 'chzzkCheese', label: '치즈 후원' }, { key: 'chzzkSubscribe', label: '치지직 구독' }] },
  {
    title: '트위치 알림',
    items: [
      { key: 'twitchBits', label: '비트 후원' },
      { key: 'twitchSubscribe', label: '트위치 구독' },
      { key: 'twitchGiftSub', label: '구독 선물' },
      { key: 'twitchGiftSubCount', label: '구독 선물 개수' },
      { key: 'twitchRaid', label: '레이드' },
    ],
  },
  { title: '투네이션 후원 알림', items: [{ key: 'toonation', label: '투네이션 후원' }] },
];

/** 후원 알림 (p71): 각 후원 종류별 알림 노출 여부 */
export default function Alerts() {
  const alerts = useData((d) => d.alerts);
  return (
    <div className="p-3 space-y-3">
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h3 className="text-[11px] font-bold text-slate-500 dark:text-gray-400 mb-1.5">{g.title}</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
            {g.items.map((i) => (
              <div key={i.key} className="rounded-2xl bg-[rgba(116,116,128,0.08)] dark:bg-[rgba(118,118,128,0.18)] px-2.5 py-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">{i.label}</span>
                <Toggle size="sm" on={alerts[i.key]} onChange={(v) => api.setAlert(i.key, v)} label={i.label} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
