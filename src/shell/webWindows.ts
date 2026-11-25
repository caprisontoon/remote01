// 웹 리모컨(브라우저·웹앱)의 위젯 창 분리.
// 설치형은 Electron 독립창을 쓰고(electron/main.ts), 웹에서는 브라우저 팝업 창(window.open)으로 같은 일을 한다.
// 웹앱(PWA)으로 설치해 쓰면 팝업도 별도 앱 창으로 뜬다.
// 분리된 창은 #/widget/<id> 주소로 같은 앱을 열고, 메인 창과는 BroadcastChannel로 상태를 맞춘다 (state/app.ts follower).
// 웹에서는 창을 항상 위에 둘 수 없어서 압정은 없다.
import { isDesktop } from '../platform';
import { uiStore } from '../state/ui';
import type { WidgetId } from '../types';

const open = new Map<WidgetId, Window>();
const CONTROL = 'toona-web-windows';
type ControlMsg = { type: 'reattach'; id: WidgetId };

const control = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CONTROL);

function syncList() {
  uiStore.set({ detached: [...open.keys()].map((id) => ({ id, pinned: false })) });
}

let watching: ReturnType<typeof setInterval> | undefined;
/** 사용자가 팝업을 직접 닫으면(X) 위젯을 끈 것으로 본다 (설치형 독립창 닫기와 같다) */
function watch() {
  if (watching) return;
  watching = setInterval(() => {
    let changed = false;
    for (const [id, w] of open) {
      if (w.closed) {
        open.delete(id);
        changed = true;
      }
    }
    if (changed) syncList();
    if (!open.size) {
      clearInterval(watching);
      watching = undefined;
    }
  }, 600);
}

/** 웹에서 창 분리를 쓸 수 있는지 (설치형은 Electron 방식, 휴대폰은 창 개념이 없어 제외) */
export const canWebDetach = () => !isDesktop && typeof window !== 'undefined' && window.innerWidth > 768;

/**
 * 위젯을 브라우저 팝업 창으로 꺼낸다. 반드시 클릭·포인터 놓기 같은 사용자 동작 안에서 불러야 팝업이 막히지 않는다.
 * 막히면 false (호출한 쪽이 위젯을 캔버스에 그대로 둔다).
 */
export function openWidgetWindow(id: WidgetId, rect: { screenX: number; screenY: number; width: number; height: number }): boolean {
  const existing = open.get(id);
  if (existing && !existing.closed) {
    existing.focus();
    return true;
  }
  const url = `${location.pathname}${location.search}#/widget/${id}`;
  const features = `popup=yes,width=${Math.round(rect.width)},height=${Math.round(rect.height)},left=${Math.round(rect.screenX)},top=${Math.round(rect.screenY)}`;
  const w = window.open(url, `toona-widget-${id}`, features);
  if (!w) return false;
  open.set(id, w);
  syncList();
  watch();
  return true;
}

/** Dock에서 끄기: 팝업을 닫는다 */
export function closeWidgetWindow(id: WidgetId) {
  open.get(id)?.close();
  open.delete(id);
  syncList();
}

/** 메인 창: 분리된 창에서 [되돌리기]를 누르면 팝업을 닫고 캔버스에 다시 놓는다 (Dock에서 추가할 때처럼 놓을 자리를 고른다) */
export function listenWebWindows() {
  if (!control) return () => {};
  const h = (e: MessageEvent<ControlMsg>) => {
    if (e.data?.type !== 'reattach' || !open.has(e.data.id)) return;
    closeWidgetWindow(e.data.id);
    window.focus();
    uiStore.set({ placing: e.data.id });
  };
  control.addEventListener('message', h);
  // 메인 창을 닫으면 분리된 창도 닫는다 (상태를 받을 곳이 없어진다)
  const bye = () => open.forEach((w) => w.close());
  window.addEventListener('pagehide', bye);
  return () => {
    control.removeEventListener('message', h);
    window.removeEventListener('pagehide', bye);
  };
}

/** 분리된 창: 메인 창으로 되돌리기 */
export function requestReattach(id: WidgetId) {
  control?.postMessage({ type: 'reattach', id } satisfies ControlMsg);
  window.close();
}
