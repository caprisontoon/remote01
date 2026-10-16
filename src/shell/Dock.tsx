import { Image, Pin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api, layoutStore, settingsStore } from '../state/app';
import { uiStore } from '../state/ui';
import { useStore } from '../state/store';
import { removeTile } from '../layout/grid';
import { mmss, useData, useNow } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { desktop } from '../platform';
import type { WidgetId } from '../types';
import { DOCK_ORDER, WIDGETS } from '../widgets/meta';
import { Badge, Tooltip } from '../components/ui';

export const DOCK_HEIGHT = 64;

/**
 * 리모컨 Dock (p10).
 * 압정 on(기본): 하단에 고정. off: 숨어 있다가 마우스를 올리면 나타나고, 벗어나면 2.5초 뒤 숨는다.
 * 위젯 추가·이동 중에는 압정과 관계없이 숨긴다.
 */
export function Dock() {
  const t = useT();
  const pinned = useStore(settingsStore, (s) => s.dockPinned);
  const tiles = useStore(layoutStore, (s) => s.tiles);
  const { placing, dragging, detached } = useStore(uiStore, (s) => s);
  const pendingCount = useData((d) => d.pending.length);
  const paused = useData((d) => d.paused);
  const vote = useData((d) => d.vote);
  const adCount = useData((d) => d.ads.filter((a) => !a.playedAt).length);
  const now = useNow();
  const [hovered, setHovered] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const forcedHidden = !!placing || dragging;
  const visible = !forcedHidden && (pinned || hovered);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const isOn = (id: WidgetId) => !!tiles[id] || detached.some((d) => d.id === id) || placing === id;
  const toggle = (id: WidgetId) => {
    if (placing) return;
    if (tiles[id]) return layoutStore.set({ tiles: removeTile(tiles, id) });
    if (detached.some((d) => d.id === id)) return desktop?.widgets.close(id);
    uiStore.set({ placing: id });
  };

  const anyPaused = paused.alert || paused.drawing || paused.draw;
  const voteLabel =
    vote.status === 'running' && vote.endsAt ? `진행 중 -${mmss(vote.endsAt - now)}` : vote.status === 'paused' ? '정지 중' : vote.status === 'reserved' ? '예약 중' : null;

  return (
    <>
      {/* 압정 off일 때 하단 가장자리에 마우스를 올리면 나타난다 */}
      {!pinned && !forcedHidden && <div className="fixed inset-x-0 bottom-0 h-3 z-[9998]" onMouseEnter={() => { clearTimeout(hideTimer.current); setHovered(true); }} />}
      <nav
        aria-label="리모컨 Dock"
        onMouseEnter={() => { clearTimeout(hideTimer.current); setHovered(true); }}
        onMouseLeave={() => { hideTimer.current = setTimeout(() => setHovered(false), 2500); }}
        className={`fixed left-1/2 -translate-x-1/2 bottom-2 z-[9999] transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0 pointer-events-none'}`}
      >
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/95 dark:bg-black/90 backdrop-blur border border-white/10 shadow-2xl">
          <Tooltip label={pinned ? 'Dock 고정 해제' : 'Dock 고정'}>
            <button aria-label="Dock 압정" aria-pressed={pinned} onClick={() => api.updateSettings({ dockPinned: !pinned })} className={`w-10 h-10 rounded-xl flex items-center justify-center ${pinned ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'}`}>
              <Pin size={17} className={pinned ? 'fill-current' : ''} />
            </button>
          </Tooltip>
          <Tooltip label={t('벽지')}>
            <button aria-label={t('벽지')} onClick={() => uiStore.set({ wallpaperOpen: true })} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 text-white/80 hover:text-white">
              <Image size={17} />
            </button>
          </Tooltip>
          <span className="w-px h-7 bg-white/15 mx-0.5" />
          {DOCK_ORDER.map((id) => {
            const meta = WIDGETS[id];
            const Icon = meta.icon;
            const on = isOn(id);
            const pausedQuick = id === 'quick' && anyPaused;
            const badge = id === 'pending' ? pendingCount : id === 'toneAd' ? adCount : 0;
            return (
              <Tooltip key={id} label={id === 'vote' && voteLabel ? `${t(meta.title)} · ${voteLabel}` : t(meta.title)}>
                <button
                  aria-label={t(meta.title)}
                  aria-pressed={on}
                  disabled={!!placing && placing !== id}
                  onClick={() => toggle(id)}
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 ${
                    pausedQuick ? 'bg-red-500 text-white blink' : on ? 'bg-white text-slate-900' : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {badge > 0 && <Badge count={badge} className="absolute -top-1.5 -right-1.5" />}
                  {id === 'vote' && vote.status !== 'idle' && (
                    <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 rounded text-[8px] font-black text-white ${vote.status === 'running' ? 'bg-blue-600' : vote.status === 'paused' ? 'bg-amber-500' : 'bg-slate-500'}`}>
                      {vote.status === 'running' ? '진행' : vote.status === 'paused' ? '정지' : '예약'}
                    </span>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </nav>
    </>
  );
}
