import { Image, Pin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api, layoutStore, settingsStore } from '../state/app';
import { uiStore } from '../state/ui';
import { useStore } from '../state/store';
import { removeTile } from '../layout/grid';
import { mmss, useData, useNow, useViewportWidth } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { desktop } from '../platform';
import type { WidgetId } from '../types';
import { DOCK_ORDER, WIDGETS } from '../widgets/meta';
import { Badge, Tooltip } from '../components/ui';

export const DOCK_HEIGHT = 60;

/**
 * 켜짐/꺼짐을 색으로 대비시킨다.
 * 켜짐 = brand-tint 바탕 + 1px brand-tint-line + link(BI 블루 계열) 아이콘 + 아래 live 점,
 * 꺼짐 = 바탕 없음 + text-tertiary 아이콘 (hover 때만 surface-raised).
 */
const DOCK_ON = 'bg-brand-tint ring-1 ring-inset ring-brand-tint-line text-link';
const DOCK_OFF = 'text-text-tertiary hover:text-text hover:bg-surface-raised';

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
  // Dock 전체 폭(약 650px)보다 창이 좁으면 가로 스크롤. 이때 위로 뜨는 툴팁은 잘리므로 브라우저 기본 툴팁(title)을 쓴다
  const scroll = useViewportWidth() < 680;
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
      {!pinned && !forcedHidden && <div className="fixed inset-x-0 bottom-0 h-3 z-dock" onMouseEnter={() => { clearTimeout(hideTimer.current); setHovered(true); }} />}
      <nav
        aria-label="리모컨 Dock"
        onMouseEnter={() => { clearTimeout(hideTimer.current); setHovered(true); }}
        onMouseLeave={() => { hideTimer.current = setTimeout(() => setHovered(false), 2500); }}
        className={`fixed left-1/2 -translate-x-1/2 bottom-2 z-dock max-w-[calc(100vw-16px)] transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0 pointer-events-none'}`}
      >
        <div className={`flex items-center gap-1 p-[6px] rounded-widget bg-surface border border-line shadow-float ${scroll ? 'overflow-x-auto [scrollbar-width:none]' : ''}`}>
          <Tooltip label={pinned ? 'Dock 고정 해제' : 'Dock 고정'}>
            <button aria-label="Dock 압정" title={scroll ? (pinned ? 'Dock 고정 해제' : 'Dock 고정') : undefined} aria-pressed={pinned} onClick={() => api.updateSettings({ dockPinned: !pinned })} className={`relative shrink-0 w-[44px] h-[44px] rounded-dock-item flex items-center justify-center ${pinned ? DOCK_ON : DOCK_OFF}`}>
              {/* 켜짐 표시는 위젯과 같은 규칙 (DOCK_ON + 아래 live 점) */}
              <Pin size={18} className={pinned ? 'fill-current' : ''} />
              {pinned && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-pill bg-live" />}
            </button>
          </Tooltip>
          <Tooltip label={t('벽지')}>
            <button aria-label={t('벽지')} title={scroll ? t('벽지') : undefined} onClick={() => uiStore.set({ wallpaperOpen: true })} className="shrink-0 w-[44px] h-[44px] rounded-dock-item flex items-center justify-center text-text-tertiary hover:text-text hover:bg-surface-raised">
              <Image size={18} />
            </button>
          </Tooltip>
          <span className="shrink-0 w-px h-[24px] bg-line mx-1" />
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
                  title={scroll ? t(meta.title) : undefined}
                  aria-pressed={on}
                  disabled={!!placing && placing !== id}
                  onClick={() => toggle(id)}
                  className={`relative shrink-0 w-[44px] h-[44px] rounded-dock-item flex items-center justify-center transition-colors disabled:opacity-30 ${
                    pausedQuick
                      ? 'bg-warning text-text-on-warning blink'
                      : on
                        ? DOCK_ON
                        : DOCK_OFF
                  }`}
                >
                  <Icon size={18} />
                  {/* 켜진 위젯 = 아래 4px live 점 */}
                  {on && !pausedQuick && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-pill bg-live" />}
                  {badge > 0 && <Badge count={badge} className="absolute -top-1.5 -right-1.5" />}
                  {id === 'vote' && vote.status !== 'idle' && (
                    <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1 rounded-tag text-[0.5rem] leading-3 font-bold ${vote.status === 'running' ? 'bg-brand text-text-on-brand' : vote.status === 'paused' ? 'bg-warning text-text-on-warning' : 'bg-line-strong text-text'}`}>
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
