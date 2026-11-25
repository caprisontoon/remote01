// 웹 리모컨(브라우저·웹앱)의 위젯 창 분리.
// 설치형은 Electron 독립창을 쓰고(electron/main.ts), 웹에서는 브라우저 팝업 창(window.open)으로 같은 일을 한다.
// 웹앱(PWA)으로 설치해 쓰면 팝업도 별도 앱 창으로 뜬다.
// 분리된 창은 #/widget/<id> 주소로 같은 앱을 열고, 메인 창과는 BroadcastChannel로 상태를 맞춘다 (state/app.ts follower).
// 웹에서는 창을 항상 위에 둘 수 없어서 압정은 없다.
// 자석(p27)도 설치형과 같은 규칙(electron/magnet.ts)을 쓴다. 단, 브라우저는 창 끌기 중간에 끼어들 수 없어서
// 분리한 창을 옮기고 놓은 뒤에 가까운 창 모서리로 붙고, 메인 창을 옮기면 붙어 있던 분리 창이 뒤따라 움직인다.
// 다른 모니터로 함께 넘어가려면 브라우저의 '창 관리' 권한이 필요하다 (requestScreenPermission).
import { attachedGroup, snap, type Box } from '../../electron/magnet';
import { api } from '../state/app';
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
  /** 메인 창이 움직였을 때 붙어 있던 분리 창들을 메인 창 기준 같은 자리로 옮긴다 (보이는 영역 왼쪽 위, 화면 좌표) */
  | { type: 'place'; items: { id: WidgetId; x: number; y: number }[] };

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

// ------------------------------------------------------------------ 여러 모니터 (창 관리 권한)

type ScreenWindow = Window & { getScreenDetails?: () => Promise<unknown> };
/** 모니터가 두 개 이상인지 (브라우저가 알려 줄 때만) */
export const hasMultipleScreens = () => typeof window !== 'undefined' && (window.screen as Screen & { isExtended?: boolean }).isExtended === true;
export const canRequestScreens = () => typeof window !== 'undefined' && typeof (window as ScreenWindow).getScreenDetails === 'function';

/**
 * 브라우저는 웹페이지가 창을 다른 모니터로 옮기지 못하게 막는다(지금 화면 안으로 되돌림).
 * '창 관리'(window-management) 권한을 허용하면 분리 창이 메인 창을 따라 다른 모니터로 넘어갈 수 있다.
 * 클릭 같은 사용자 동작 안에서 불러야 권한 창이 뜬다. 허용되면 true.
 */
export async function requestScreenPermission(): Promise<boolean> {
  if (!canRequestScreens()) return false;
  try {
    await (window as ScreenWindow).getScreenDetails!();
    return true;
  } catch {
    return false;
  }
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
  // 모니터가 여러 개면 분리할 때 '창 관리' 권한을 묻는다 (분리 창이 메인 창을 따라 다른 모니터로 넘어가려면 필요).
  // 클릭의 사용자 동작이 남아 있을 때 window.open보다 먼저 불러야 권한 창이 뜬다. 이미 허용·차단했으면 다시 묻지 않는다.
  if (hasMultipleScreens()) void requestScreenPermission();
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

/**
 * Windows 창은 좌·우·아래에 보이지 않는 크기 조절 테두리(약 7~8px)가 있고, screenX·outerWidth에 이 부분이 들어간다.
 * 그대로 맞대면 눈에 보이는 모서리 사이에 틈이 생기므로, 보이는 영역 기준으로 붙인다.
 * 테두리 폭 = (outerWidth − innerWidth) / 2 (Windows의 브라우저·웹앱 창은 좌우 프레임이 보이지 않는다)
 */
const IS_WINDOWS = typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);
const insetOf = () => (IS_WINDOWS ? Math.max(0, Math.round((window.outerWidth - window.innerWidth) / 2)) : 0);
/** 눈에 보이는 창 영역 (화면 좌표) */
const boxOf = (): Box => {
  const i = insetOf();
  return { x: window.screenX + i, y: window.screenY, width: window.outerWidth - 2 * i, height: window.outerHeight - i };
};
/** 보이는 영역의 왼쪽 위를 그 위치로 옮긴다 (moveTo는 바깥 테두리 기준) */
const moveVisibleTo = (x: number, y: number) => window.moveTo(x - insetOf(), y);
const sameBox = (a: Box, b: Box) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
/** 이 시간(ms) 동안 위치가 그대로면 "놓았다"로 본다 */
const SETTLE_MS = 250;
/** 메인 창을 따라간 뒤 이만큼 지나서 최종 위치를 확인한다 */
const FOLLOW_CHECK_MS = 800;
/** 최종 위치가 이보다 멀면 못 따라간 것으로 본다 (모니터마다 화면 배율이 달라 생기는 작은 어긋남은 넘긴다) */
const FOLLOW_MISS_PX = 120;

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
  /** 자석으로 옮기라고 한 위치. 다음 확인 때 그대로면 브라우저가 창 이동을 막은 것이다 */
  let pending: { from: Box; to: Box } | null = null;
  let warned = false;
  /** 메인 창: 이번 이동에서 같이 움직일 분리 창과 메인 창 기준 상대 위치 (이동을 시작할 때 정하고, 멈추면 비운다) */
  let group: Map<WidgetId, { dx: number; dy: number }> | null = null;
  /** 분리 창: 메인 창을 따라가라고 마지막으로 받은 위치와 시각. 이동이 끝난 뒤에도 많이 다르면 다른 모니터로 못 넘어간 것이다 */
  let placed: { x: number; y: number; at: number } | null = null;
  let warnedScreen = false;
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
    if (m.type === 'place' && key !== 'main') {
      const mine = m.items.find((it) => it.id === key);
      if (mine) {
        moveVisibleTo(mine.x, mine.y);
        placed = { x: mine.x, y: mine.y, at: Date.now() };
        moved = false; // 따라 움직인 것은 "사용자가 옮긴 것"이 아니다
      }
    }
  };
  control.addEventListener('message', onMsg);
  post({ type: 'bounds', from: key, box: last });

  const timer = setInterval(() => {
    const b = boxOf();
    // 메인 창 이동이 끝난 뒤(마지막 위치를 받고 FOLLOW_CHECK_MS 지남)에만 판단한다. 따라가는 도중의 늦음은 정상이다
    if (placed && Date.now() - placed.at > FOLLOW_CHECK_MS) {
      // 그래도 멀리 떨어져 있다 = 화면 끝에서 막혔다 = 브라우저가 다른 모니터로 옮기는 것을 막았다 (창 관리 권한 없음)
      if ((Math.abs(b.x - placed.x) > FOLLOW_MISS_PX || Math.abs(b.y - placed.y) > FOLLOW_MISS_PX) && !warnedScreen) {
        warnedScreen = true;
        api.toast("분리한 창이 다른 모니터로 따라가지 못했습니다. 주소창 왼쪽 사이트 정보(웹앱은 메뉴 ⋯ → 앱 정보) → 권한에서 '창 관리'를 허용해 주세요.", 'error', 7000);
      }
      placed = null;
    }
    if (pending) {
      if (sameBox(b, pending.from) && !warned) {
        warned = true;
        api.toast('이 브라우저는 창 이동을 허용하지 않아 자석 기능을 쓸 수 없습니다.', 'error', 4000);
      }
      pending = null;
    }
    if (!sameBox(b, last)) {
      const prev = last;
      last = b;
      post({ type: 'bounds', from: key, box: b });
      if (key === 'main' && (b.x !== prev.x || b.y !== prev.y)) {
        // 이동을 시작할 때 붙어 있던 창들을 정해 두고, 끝날 때까지 메인 창 기준 같은 자리로 옮긴다
        // (중간에 화면 끝 등에서 잠깐 막혀도 무리에서 빠지지 않는다)
        if (!group) {
          const popups = new Map([...others].filter(([k]) => k !== 'main')) as Map<WidgetId, Box>;
          group = new Map(attachedGroup(prev, popups).map((id) => [id, { dx: popups.get(id)!.x - prev.x, dy: popups.get(id)!.y - prev.y }]));
        }
        if (group.size) {
          const items = [...group].map(([id, o]) => ({ id, x: b.x + o.dx, y: b.y + o.dy }));
          post({ type: 'place', items });
          items.forEach((it) => others.set(it.id, { ...others.get(it.id)!, x: it.x, y: it.y }));
        }
      }
      moved = true;
      movedAt = Date.now();
      return;
    }
    if (key === 'main' && group && Date.now() - movedAt > SETTLE_MS) group = null;
    if (key !== 'main' && moved && Date.now() - movedAt > SETTLE_MS) {
      moved = false;
      const s = snap(b, [...others].filter(([k]) => k !== key).map(([, v]) => v));
      if (s.x !== b.x || s.y !== b.y) {
        pending = { from: b, to: s };
        moveVisibleTo(s.x, s.y);
      }
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
