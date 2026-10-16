import { api } from '../state/app';
import { useData } from '../lib/hooks';
import type { VolumeKey } from '../types';

const ITEMS: { key: VolumeKey; label: string }[] = [
  { key: 'tts', label: 'TTS' },
  { key: 'video', label: '영상' },
  { key: 'voice', label: '음성' },
  { key: 'roulette', label: '룰렛' },
  { key: 'luckybox', label: '럭키박스' },
  { key: 'play', label: '플레이' },
  { key: 'draw', label: '뽑기' },
];

/** 볼륨 제어 (p68): 각 후원 기능의 볼륨 조절 */
export default function Volume() {
  const volume = useData((d) => d.volume);
  return (
    <div className="p-3 space-y-2.5">
      {ITEMS.map((i) => (
        <label key={i.key} className="grid grid-cols-[56px_1fr_40px] items-center gap-2 text-xs">
          <span className="font-semibold">{i.label}</span>
          <input type="range" min={0} max={100} value={volume[i.key]} onChange={(e) => api.setVolume(i.key, Number(e.target.value))} className="accent-blue-600 w-full" aria-label={`${i.label} 볼륨`} />
          <span className="text-right tabular-nums text-slate-500">{volume[i.key]}%</span>
        </label>
      ))}
    </div>
  );
}
