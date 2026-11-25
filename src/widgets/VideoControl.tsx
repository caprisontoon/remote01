import { api } from '../state/app';
import { useData } from '../lib/hooks';
import { Toggle } from '../components/ui';

/** 영상 후원 제어 (p72). 자동 재생 OFF면 영상 후원은 '대기 중인 후원'에서 확인 후 수락한다. */
export default function VideoControl() {
  const video = useData((d) => d.video);
  const rows = [
    { key: 'autoplay' as const, label: '자동 재생', desc: '영상 후원을 받으면 바로 재생합니다. OFF면 대기 중인 후원에서 수락 후 재생합니다.' },
    { key: 'audioOnly' as const, label: '음성만 재생', desc: '영상은 노출하지 않고 소리만 재생합니다.' },
  ];
  return (
    <div className="p-3 grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
      {rows.map((r) => (
        <div key={r.key} className="rounded-card bg-surface-raised border border-line p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-body font-semibold text-text">{r.label}</span>
            <Toggle on={video[r.key]} onChange={(v) => api.setVideo({ [r.key]: v })} label={r.label} />
          </div>
          <p className="mt-1.5 text-micro leading-relaxed text-text-secondary">{r.desc}</p>
        </div>
      ))}
    </div>
  );
}
