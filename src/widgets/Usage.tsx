import { useState } from 'react';
import { api } from '../state/app';
import { useData } from '../lib/hooks';
import type { UsageKey } from '../types';
import { Confirm, Toggle } from '../components/ui';
import { crewToggleEffect, isCrewLive, masterToggleEffect } from '../lib/crew';

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

/**
 * 후원 사용 (p69~70). 크리에이터 페이지 설정과 연동되며, 전체 OFF면 도네이터 페이지의 모든 후원 메뉴가 비활성화된다.
 * [크루 후원] 위젯과 함께 동작한다 (규칙은 lib/crew.ts):
 * - 크루 방송 중에 [크루]를 끄면 방송이 종료되므로 확인을 받는다.
 * - 크루 방송 중에 전체를 꺼도 방송은 유지된다. 그동안 크루 후원도 받을 수 없다는 것을 알린다.
 */
export default function Usage() {
  const master = useData((d) => d.usageMaster);
  const usage = useData((d) => d.usage);
  const live = useData((d) => isCrewLive(d.crew));
  const [confirm, setConfirm] = useState<'crewOff' | 'masterOff' | null>(null);
  const count = master ? ITEMS.filter((i) => usage[i.key]).length : 0;

  const setMaster = (on: boolean) => (masterToggleEffect(on, live) === 'confirmKeepLive' ? setConfirm('masterOff') : api.setUsageMaster(on));
  const setItem = (key: UsageKey, on: boolean) => {
    if (key === 'crew' && crewToggleEffect(on, live) === 'confirmEnd') return setConfirm('crewOff');
    api.setUsage(key, on);
    if (key === 'crew' && on) api.toast('크루 후원을 켰습니다. [크루 후원] 위젯에서 방송을 시작할 수 있습니다.');
  };

  return (
    <div className="p-3">
      <div className={`flex items-center justify-between rounded-card border px-3 py-2.5 mb-3 ${master ? 'bg-brand-tint border-brand-tint-line' : 'bg-surface-raised border-line'}`}>
        <div>
          <div className="text-body font-semibold text-text">{master ? '후원 기능 사용 중' : '후원 기능 사용 중지'}</div>
          <div className="text-caption text-text-secondary">사용 중인 후원 : {count}개</div>
          {!master && live && <div className="mt-0.5 text-caption font-semibold text-warning-text">크루 방송 중 · 후원 받기 중지됨</div>}
        </div>
        <Toggle on={master} onChange={setMaster} label="후원 기능 사용" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2">
        {ITEMS.map((i) => {
          const crewLive = i.key === 'crew' && live;
          return (
            <div
              key={i.key}
              title={crewLive ? '크루 방송 중입니다. 끄면 방송이 종료됩니다.' : undefined}
              className={`relative rounded-card border p-2 flex flex-col items-center gap-1.5 ${crewLive ? 'bg-surface-raised border-danger/50' : 'bg-surface-raised border-line'} ${master ? '' : 'opacity-50'}`}
            >
              {crewLive && <span className="absolute top-1 right-1 px-1 rounded-tag bg-danger text-white text-[0.5625rem] leading-[0.875rem] font-bold">LIVE</span>}
              <span className="text-caption font-semibold text-text truncate max-w-full">{i.label}</span>
              <Toggle size="sm" on={usage[i.key]} disabled={!master} onChange={(v) => setItem(i.key, v)} label={i.label} />
            </div>
          );
        })}
      </div>
      {confirm === 'crewOff' && (
        <Confirm
          danger
          confirmLabel="방송 종료"
          message="현재 방송중인 크루 후원이 있습니다."
          note={'사용하지 않음으로 변경 시 종료 처리됩니다.\n사용하지 않음으로 변경 하시겠습니까?'}
          onConfirm={() => {
            api.setUsage('crew', false);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'masterOff' && (
        <Confirm
          confirmLabel="후원 기능 끄기"
          message="후원 기능을 모두 끄시겠습니까?"
          note={'크루 방송은 종료되지 않고 계속 진행됩니다.\n다만 다시 켤 때까지 크루 후원도 받을 수 없습니다.'}
          onConfirm={() => {
            api.setUsageMaster(false);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
