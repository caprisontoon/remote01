// 설치형 리모컨(Electron) 메인 프로세스.
// 웹 리모컨과 같은 화면(dist)을 띄우고, 설치형 전용 기능을 맡는다:
// 위젯 독립창 분리/복귀, 자석 기능, 압정(항상 위), 전역 단축키, 창 상태 저장.
import { BrowserWindow, app, globalShortcut, ipcMain, shell, type IpcMainEvent, type Rectangle } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { attachedGroup, snap, type Box } from './magnet';
import { ToonationFeed } from './toonation';

const DEV_URL = process.env.VITE_DEV_SERVER_URL;
const MAIN_MIN = { width: 900, height: 600 }; // ※ 기획서: 디자인팀 확인 필요 — 임시 값

interface DetachedInfo {
  bounds: Rectangle;
  pinned: boolean;
  minWidth: number;
  minHeight: number;
  title: string;
}
interface SavedState {
  main?: Rectangle;
  maximized?: boolean;
  detached: Record<string, DetachedInfo>;
}

const statePath = () => path.join(app.getPath('userData'), 'window-state.json');
function readState(): SavedState {
  try {
    return { detached: {}, ...JSON.parse(fs.readFileSync(statePath(), 'utf8')) };
  } catch {
    return { detached: {} };
  }
}
let state: SavedState = { detached: {} };
let saveTimer: NodeJS.Timeout | undefined;
function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(statePath(), JSON.stringify(state, null, 2));
    } catch {
      /* 저장 실패는 무시 (다음 저장 때 재시도) */
    }
  }, 300);
}

let main: BrowserWindow | null = null;
/** keepInState: 앱 종료로 닫힐 때만 true — 다음 실행에서 복원한다 (p26 리모컨 종료 시 상태 저장) */
const detached = new Map<string, { win: BrowserWindow; info: DetachedInfo; keepInState: boolean }>();

const preload = path.join(__dirname, 'preload.cjs');

function load(win: BrowserWindow, hash = '') {
  if (DEV_URL) void win.loadURL(`${DEV_URL}${hash ? `#${hash}` : ''}`);
  else void win.loadFile(path.join(__dirname, '../dist/index.html'), hash ? { hash } : undefined);
}

function guardNavigation(win: BrowserWindow) {
  // 외부 링크는 앱 안이 아니라 기본 브라우저로 연다
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    const allowed = DEV_URL ? url.startsWith(DEV_URL) : url.startsWith('file://');
    if (!allowed) {
      e.preventDefault();
      if (/^https?:\/\//.test(url)) void shell.openExternal(url);
    }
  });
}

const webPreferences = { preload, contextIsolation: true, nodeIntegration: false, sandbox: true };

function createMain() {
  const b = state.main;
  main = new BrowserWindow({
    ...(b ?? { width: 1280, height: 800 }),
    minWidth: MAIN_MIN.width,
    minHeight: MAIN_MIN.height,
    frame: false,
    show: false,
    title: 'TOONA 리모컨',
    backgroundColor: '#f2f2f7',
    webPreferences,
  });
  if (state.maximized) main.maximize();
  guardNavigation(main);
  load(main);
  main.once('ready-to-show', () => main?.show());
  main.webContents.once('did-finish-load', restoreDetached);

  let last = main.getBounds();
  main.on('move', () => {
    if (!main || main.isMaximized() || main.isMinimized()) return;
    const now = main.getBounds();
    const dx = now.x - last.x;
    const dy = now.y - last.y;
    if (dx || dy) {
      // 메인 창을 옮기면 붙어 있는 위젯 창도 함께 이동 (p27)
      const boxes = new Map<string, Box>([...detached].map(([id, d]) => [id, d.win.getBounds()]));
      for (const id of attachedGroup(last, boxes)) {
        const w = detached.get(id)!.win;
        const wb = w.getBounds();
        w.setPosition(wb.x + dx, wb.y + dy);
        detached.get(id)!.info.bounds = w.getBounds();
      }
    }
    last = now;
    rememberMain();
  });
  main.on('resize', rememberMain);
  main.on('close', () => {
    rememberMain();
    // 메인을 닫으면 독립창도 닫되, 다음 실행에서 복원할 수 있게 상태는 남긴다
    for (const d of detached.values()) {
      d.keepInState = true;
      d.win.close();
    }
  });
  main.on('closed', () => {
    main = null;
    app.quit();
  });
}

function rememberMain() {
  if (!main) return;
  state.maximized = main.isMaximized();
  if (!state.maximized && !main.isMinimized()) state.main = main.getBounds();
  saveState();
}

function notifyWidgets() {
  const list = [...detached].map(([id, d]) => ({ id, pinned: d.info.pinned }));
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send('widgets:changed', list);
}

function createDetached(id: string, info: DetachedInfo) {
  if (detached.has(id)) {
    detached.get(id)!.win.focus();
    return;
  }
  const win = new BrowserWindow({
    ...info.bounds,
    minWidth: info.minWidth,
    minHeight: info.minHeight,
    frame: false,
    title: info.title,
    backgroundColor: '#ffffff',
    webPreferences,
  });
  guardNavigation(win);
  load(win, `/widget/${id}`);
  if (info.pinned) win.setAlwaysOnTop(true, 'floating');
  const entry = { win, info, keepInState: false };
  detached.set(id, entry);
  state.detached[id] = info;
  saveState();
  win.on('moved', () => { entry.info.bounds = win.getBounds(); saveState(); });
  win.on('resized', () => { entry.info.bounds = win.getBounds(); saveState(); });
  win.on('closed', () => {
    detached.delete(id);
    if (!entry.keepInState) delete state.detached[id];
    saveState();
    notifyWidgets();
  });
  notifyWidgets();
}

function restoreDetached() {
  for (const [id, info] of Object.entries(state.detached)) createDetached(id, info);
}

// ---------------------------------------------------------------- IPC

const senderWindow = (e: IpcMainEvent) => BrowserWindow.fromWebContents(e.sender);
const detachedIdOf = (e: IpcMainEvent) => [...detached].find(([, d]) => d.win.webContents === e.sender)?.[0];

ipcMain.on('window:minimize', (e) => senderWindow(e)?.minimize());
ipcMain.on('window:toggleMaximize', (e) => {
  const w = senderWindow(e);
  if (w) w.isMaximized() ? w.unmaximize() : w.maximize();
});
ipcMain.on('window:close', (e) => senderWindow(e)?.close());
ipcMain.on('window:setPinned', (e, on: boolean) => {
  const w = senderWindow(e);
  w?.setAlwaysOnTop(on, 'floating');
  if (on) w?.moveTop();
});

ipcMain.on('widgets:detach', (_e, id: string, o: { screenX: number; screenY: number; width: number; height: number; minWidth: number; minHeight: number; title: string }) => {
  createDetached(id, {
    bounds: { x: o.screenX, y: o.screenY, width: Math.max(o.width, o.minWidth), height: Math.max(o.height, o.minHeight) },
    pinned: false,
    minWidth: o.minWidth,
    minHeight: o.minHeight,
    title: o.title,
  });
});
ipcMain.on('widgets:close', (_e, id: string) => detached.get(id)?.win.close());
ipcMain.on('widgets:reattach', (_e, id: string) => {
  detached.get(id)?.win.close();
});
ipcMain.on('widgets:setPinned', (_e, id: string, on: boolean) => {
  const d = detached.get(id);
  if (!d) return;
  // 압정 on: 다른 창보다 항상 위. 여러 개면 최근에 켠 창이 가장 위 (p28)
  d.win.setAlwaysOnTop(on, 'floating');
  if (on) d.win.moveTop();
  d.info.pinned = on;
  saveState();
  notifyWidgets();
});
ipcMain.handle('widgets:list', () => [...detached].map(([id, d]) => ({ id, pinned: d.info.pinned })));

// 독립창 헤더 드래그: 창 이동 + 자석 + 메인 창 위로 끌어오기(드레그 인)
let drag: { id: string; offX: number; offY: number; overMain: boolean } | null = null;

function mainContentPoint(sx: number, sy: number) {
  if (!main || main.isMinimized()) return null;
  const c = main.getContentBounds();
  if (sx < c.x || sy < c.y || sx > c.x + c.width || sy > c.y + c.height) return null;
  return { clientX: sx - c.x, clientY: sy - c.y };
}

ipcMain.on('widgets:dragStart', (e, sx: number, sy: number) => {
  const id = detachedIdOf(e);
  if (!id) return;
  const b = detached.get(id)!.win.getBounds();
  drag = { id, offX: sx - b.x, offY: sy - b.y, overMain: false };
});
ipcMain.on('widgets:dragMove', (e, sx: number, sy: number) => {
  if (!drag || detachedIdOf(e) !== drag.id) return;
  const d = detached.get(drag.id)!;
  const b = d.win.getBounds();
  const others: Box[] = [main?.getBounds(), ...[...detached].filter(([k]) => k !== drag!.id).map(([, x]) => x.win.getBounds())].filter((x): x is Rectangle => !!x);
  const next = snap({ x: Math.round(sx - drag.offX), y: Math.round(sy - drag.offY), width: b.width, height: b.height }, others);
  d.win.setPosition(next.x, next.y);
  const p = mainContentPoint(sx, sy);
  if (p) {
    main!.webContents.send('widgets:dragOver', { id: drag.id, ...p });
    drag.overMain = true;
  } else if (drag.overMain) {
    main?.webContents.send('widgets:dragOver', null);
    drag.overMain = false;
  }
});
ipcMain.on('widgets:dragEnd', (e, sx: number, sy: number) => {
  if (!drag || detachedIdOf(e) !== drag.id) return;
  const p = mainContentPoint(sx, sy);
  if (p) main!.webContents.send('widgets:drop', { id: drag.id, ...p });
  else if (drag.overMain) main?.webContents.send('widgets:dragOver', null);
  const d = detached.get(drag.id);
  if (d) {
    d.info.bounds = d.win.getBounds();
    saveState();
  }
  drag = null;
});

// 창 간 상태 동기화: 받은 메시지를 다른 모든 창에 전달
ipcMain.on('sync:post', (e, msg: unknown) => {
  for (const w of BrowserWindow.getAllWindows()) if (w.webContents !== e.sender) w.webContents.send('sync:msg', msg);
});

// 전역 단축키 (p15): 다른 프로그램보다 우선. 등록 실패(충돌)는 결과로 알려준다.
ipcMain.handle('shortcuts:set', (_e, list: { id: string; action: string; accelerator: string }[]) => {
  globalShortcut.unregisterAll();
  return list.map((s) => {
    if (!s.action || !s.accelerator) return { id: s.id, ok: true };
    try {
      const ok = globalShortcut.register(s.accelerator, () => main?.webContents.send('shortcut', s.action));
      return { id: s.id, ok };
    } catch {
      return { id: s.id, ok: false };
    }
  });
});

// 투네이션 실시간 후원 수신. 받은 원본 메시지 20개는 필드 확인(진단)용으로 보관한다.
const rawMessages: unknown[] = [];
const toonation = new ToonationFeed(
  (status) => main?.webContents.send('toonation:status', status),
  (donation) => main?.webContents.send('toonation:donation', donation),
  (raw) => {
    rawMessages.unshift(raw);
    rawMessages.length = Math.min(rawMessages.length, 20);
  },
);
ipcMain.handle('toonation:connect', (_e, input: string) => toonation.connect(input));
ipcMain.handle('toonation:disconnect', () => toonation.disconnect());
ipcMain.handle('toonation:rawMessages', () => rawMessages);

ipcMain.on('app:openExternal', (_e, url: string) => {
  if (/^https?:\/\//.test(url)) void shell.openExternal(url);
});
ipcMain.on('app:quit', () => app.quit());

// ---------------------------------------------------------------- 앱 수명주기

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!main) return;
    if (main.isMinimized()) main.restore();
    main.focus();
  });
  app.whenReady().then(() => {
    state = readState();
    createMain();
  });
  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', () => app.quit());
}
