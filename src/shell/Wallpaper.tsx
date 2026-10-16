import { Trash2 } from 'lucide-react';
import { api } from '../state/app';
import { contentText, formatCash } from '../lib/donation';
import { useData } from '../lib/hooks';
import { Empty, Modal } from '../components/ui';

/**
 * 벽지 창.
 * ※ 기획서(v0.21)에 '벽지' 기능의 상세 정의가 없어, 리스트의 [벽지 등록]으로 모은 후원을 보여주는 창으로 구현했다.
 *   정의가 확정되면 이 화면을 교체한다.
 */
export function WallpaperModal({ onClose }: { onClose: () => void }) {
  const ids = useData((d) => d.wallpaper);
  const donations = useData((d) => d.donations);
  const items = ids.map((id) => donations.find((d) => d.id === id)).filter((d) => !!d);
  return (
    <Modal title="벽지" onClose={onClose}>
      {items.length === 0 ? (
        <Empty>{'벽지에 등록한 후원이 없습니다.\n후원 리스트에서 [벽지 등록] 버튼으로 추가할 수 있습니다.'}</Empty>
      ) : (
        <ul className="divide-y divide-black/[0.08] dark:divide-white/10">
          {items.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-5 py-3 text-xs">
              <div className="flex-1 min-w-0">
                <div className="font-bold">{d.nickname} · {formatCash(d.cash)}</div>
                <div className="text-slate-500 truncate">{contentText(d)}</div>
              </div>
              <button aria-label="벽지에서 삭제" onClick={() => api.removeWallpaper(d.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
