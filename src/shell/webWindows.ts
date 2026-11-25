// 웹 리모컨(브라우저·웹앱)의 위젯 창 분리.
// 설치형은 Electron 독립창을 쓰고(electron/main.ts), 웹에서는 브라우저 팝업 창(window.open)으로 같은 일을 한다.
// 웹앱(PWA)으로 설치해 쓰면 팝업도 별도 앱 창으로 뜬다.
// 분리된 창은 #/widget/<id> 주소로 같은 앱을 열고, 메인 창과는 BroadcastChannel로 상태를 맞춘다 (state/app.ts follower).
// 웹에서는 창을 항상 위에 둘 수 없어서 압정은 없다.
// 자석(p27)도 설치형과 같은 규칙(electron/magnet.ts)을 쓴다. 단, 브라우저는 창 끌기 중간에 끼어들 수 없어서
// 분리한 창을 옮기고 놓은 뒤에 가까운 창 모서리로 붙고, 메인 창을 옮기면 붙어 있던 분리 창이 뒤따라 움직인다.
import { attachedGroup, snap, type Box } from '../../electron/magnet';
import { isDesktop } from '../platform';
import { uiStore } from '../state/ui';
import type { WidgetId } from '../types';

const open = new Map<WidgetId, Window>();
const CONTROL = 'toona-web-windows';
/** 창 이름: 메인 창은 'main', 분리 창은 위젯 id */
type WinKey = 'main' | WidgetId;
type ControlMsg =
  | { type: 'reattach'; id: WidgetId }
  /** 창 위치·크기 알림 (화면 좌표, 바깥 테두리 기준) */
  | { type: 'bounds'; from: WinKey; box: Box }
  | { type: 'bye'; from: WinKey }
  /** 메인 창이 움직였을 때 붙어 있던 분리 창들이 같이 움직인다 */
  | { type: 'follow'; ids: WidgetId[]; dx: number; dy: number };

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
  const stopMagnet = startMagnet('main');
  // 메인 창을 닫으면 분리된 창도 닫는다 (상태를 받을 곳이 없어진다)
  const bye = () => open.forEach((w) => w.close());
  window.addEventListener('pagehide', bye);
  return () => {
    control.removeEventListener('message', h);
    window.removeEventListener('pagehide', bye);
    stopMagnet();
  };
}

// ------------------------------------------------------------------ 자석

const boxOf = (): Box => ({ x: window.screenX, y: window.screenY, width: window.outerWidth, height: window.outerHeight });
const sameBox = (a: Box, b: Box) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
/** 이 시간(ms) 동안 위치가 그대로면 "놓았다"로 본다 */
const SETTLE_MS = 250;

/**
 * 창마다 하나씩 돈다. 자기 위치를 다른 창에 알리고,
 * - 분리 창: 옮긴 뒤 멈추면 다른 창(메인·분리 창) 모서리에 붙는다 (window.moveTo는 스크립트로 연 창에서만 된다)
 * - 메인 창: 옮기면 직접·간접으로 붙어 있던 분리 창들에 같이 움직이라고 알린다
 */
export function startMagnet(key: WinKey) {
  if (!control || isDesktop) return () => {};
  const others = new Map<WinKey, Box>();
  let last = boxOf();
  let moved = false;
  let movedAt = 0;
  const post = (msg: ControlMsg) => control.postMessage(msg);

  const onMsg = (e: MessageEvent<ControlMsg>) => {
    const m = e.data;
    if (!m) return;
    if (m.type === 'bounds' && m.from !== key) {
      const isNew = !others.has(m.from);
      others.set(m.from, m.box);
      if (isNew) post({ type: 'bounds', from: key, box: last }); // 새로 열린 창에 내 위치를 알려 준다
    }
    if (m.type === 'bye') others.delete(m.from);
    if (m.type === 'follow' && key !== 'main' && m.ids.includes(key)) {
      window.moveBy(m.dx, m.dy);
      moved = false; // 따라 움직인 것은 "사용자가 옮긴 것"이 아니다
    }
  };
  control.addEventListener('message', onMsg);
  post({ type: 'bounds', from: key, box: last });

  const timer = setInterval(() => {
    const b = boxOf();
    if (!sameBox(b, last)) {
      const prev = last;
      last = b;
      post({ type: 'bounds', from: key, box: b });
      if (key === 'main' && (b.x !== prev.x || b.y !== prev.y)) {
        const popups = new Map([...others].filter(([k]) => k !== 'main')) as Map<WidgetId, Box>;
        const ids = attachedGroup(prev, popups);
        if (ids.length) {
          post({ type: 'follow', ids, dx: b.x - prev.x, dy: b.y - prev.y });
          ids.forEach((id) => others.set(id, { ...popups.get(id)!, x: popups.get(id)!.x + b.x - prev.x, y: popups.get(id)!.y + b.y - prev.y }));
        }
      }
      moved = true;
      movedAt = Date.now();
      return;
    }
    if (key !== 'main' && moved && Date.now() - movedAt > SETTLE_MS) {
      moved = false;
      const s = snap(b, [...others].filter(([k]) => k !== key).map(([, v]) => v));
      if (s.x !== b.x || s.y !== b.y) window.moveTo(s.x, s.y);
    }
  }, 100);

  const bye = () => post({ type: 'bye', from: key });
  window.addEventListener('pagehide', bye);
  return () => {
    clearInterval(timer);
    control.removeEventListener('message', onMsg);
    window.removeEventListener('pagehide', bye);
    bye();
  };
}

/** 분리된 창: 메인 창으로 되돌리기 */
export function requestReattach(id: WidgetId) {
  control?.postMessage({ type: 'reattach', id } satisfies ControlMsg);
  window.close();
}
