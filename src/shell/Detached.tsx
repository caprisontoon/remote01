import { useStore } from '../state/store';
import { uiStore } from '../state/ui';
import { useData } from '../lib/hooks';
import { desktop } from '../platform';
import type { WidgetId } from '../types';
import { WIDGET_COMPONENTS } from '../widgets/registry';
import { WidgetFrame } from './WidgetFrame';
import { Toasts } from '../components/ui';
import { useEffect } from 'react';
import { WIDGETS } from '../widgets/meta';
import { requestReattach, startMagnet } from './webWindows';

/**
 * 독립창으로 분리된 위젯.
 * - 설치형: 헤더를 끌면 창이 이동하고(자석 기능은 메인 프로세스가 처리), 메인 창 위에 놓으면 다시 도킹된다. 압정 = 항상 위.
 * - 웹(브라우저 팝업, webWindows.ts): 창 이동은 브라우저 제목줄로 한다. [메인 창으로 되돌리기]와 닫기만 있고 압정은 없다.
 */
export function DetachedWidget({ id }: { id: WidgetId }) {
  const ready = useData((d) => d.session.phase === 'ready');
  const pinned = useStore(uiStore, (s) => s.detached.find((d) => d.id === id)?.pinned ?? false);
  const Body = WIDGET_COMPONENTS[id];

  useEffect(() => {
    document.title = `${WIDGETS[id].title} · TOONA 리모컨`;
    if (!desktop) return startMagnet(id); // 웹: 자석
    desktop.widgets.list().then((list) => uiStore.set({ detached: list }));
    return desktop.widgets.onChanged((list) => uiStore.set({ detached: list }));
  }, []);

  const startDrag = (e: React.PointerEvent) => {
    if (!desktop || e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    desktop.widgets.dragStart(e.screenX, e.screenY);
    const move = (ev: PointerEvent) => desktop!.widgets.dragMove(ev.screenX, ev.screenY);
    const up = (ev: PointerEvent) => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      desktop!.widgets.dragEnd(ev.screenX, ev.screenY);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  };

  return (
    <div className="h-full p-0 bg-canvas">
      <WidgetFrame
        id={id}
        symbol
        onHeaderPointerDown={desktop ? startDrag : undefined}
        pinned={pinned}
        onTogglePin={desktop ? () => desktop!.widgets.setPinned(id, !pinned) : undefined}
        onReattach={desktop ? undefined : () => requestReattach(id)}
        onClose={() => (desktop ? desktop.widgets.close(id) : window.close())}
      >
        {ready ? <Body /> : <div className="h-full flex items-center justify-center text-caption text-text-tertiary">연결 중…</div>}
      </WidgetFrame>
      <Toasts />
    </div>
  );
}
