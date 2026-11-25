// 앱 전체 상태 연결.
// 메인 창(leader)이 백엔드와 상태를 갖고, 분리된 위젯 창(follower)은 상태를 받아 그리고 동작만 요청한다.
// 그래서 분리된 창도 메인 창과 같은 데이터·테마를 실시간으로 공유한다 (p19 독립창 속성 유지).
import type { BackendMethod, RemoteBackend } from '../api/backend';
import { MockBackend, initialData } from '../api/mock';
import { desktop } from '../platform';
import type { Preset, Settings, Tiles } from '../types';
import { DEFAULT_SETTINGS, type RemoteData } from './data';
import { createStore } from './store';

export type Api = RemoteBackend & { updateSettings(patch: Partial<Settings>): void };

type Msg =
  | { type: 'hello' }
  | { type: 'state'; data: RemoteData; settings: Settings }
  | { type: 'call'; id: number; method: BackendMethod | 'updateSettings'; args: unknown[] }
  | { type: 'result'; id: number; value: unknown };

export const detachedWidgetId = (() => {
  if (typeof location === 'undefined') return null;
  const m = /^#\/widget\/(\w+)/.exec(location.hash);
  return m ? m[1] : null;
})();
export const role: 'leader' | 'follower' = detachedWidgetId ? 'follower' : 'leader';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

export const dataStore = createStore<RemoteData>(initialData());
export const settingsStore = createStore<Settings>(load('toona.settings', DEFAULT_SETTINGS));

/** 초기 노출 위젯: 후원 리스트, 퀵 제어 (p20) */
export const DEFAULT_TILES: Tiles = {
  donations: { x: 0, y: 0, w: 1, h: 0.8 },
  quick: { x: 0, y: 0.8, w: 1, h: 0.2 },
};

export interface LayoutState {
  tiles: Tiles;
  presets: Preset[];
  activePresetId: string | null;
}
export const layoutStore = createStore<LayoutState>(load('toona.layout', { tiles: DEFAULT_TILES, presets: [], activePresetId: null }));
if (role === 'leader') layoutStore.subscribe(() => save('toona.layout', layoutStore.get()));

// ---------------------------------------------------------------- 창 간 메시지

const channel = (() => {
  if (desktop) return desktop.sync;
  if (typeof BroadcastChannel === 'undefined') return { post() {}, on: () => () => {} };
  const bc = new BroadcastChannel('toona-sync');
  return {
    post: (msg: unknown) => bc.postMessage(msg),
    on: (cb: (msg: unknown) => void) => {
      const h = (e: MessageEvent) => cb(e.data);
      bc.addEventListener('message', h);
      return () => bc.removeEventListener('message', h);
    },
  };
})();

let api: Api;

if (role === 'leader') {
  const backend = new MockBackend(dataStore);
  const updateSettings = (patch: Partial<Settings>) => settingsStore.set(patch);
  api = Object.assign(backend, { updateSettings }) as unknown as Api;
  // bind: 컴포넌트에서 api.method를 떼어 써도 동작하도록
  for (const key of Object.getOwnPropertyNames(MockBackend.prototype)) {
    const fn = (backend as unknown as Record<string, unknown>)[key];
    if (typeof fn === 'function' && key !== 'constructor') (api as unknown as Record<string, unknown>)[key] = fn.bind(backend);
  }

  let queued = false;
  const broadcast = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      channel.post({ type: 'state', data: dataStore.get(), settings: settingsStore.get() } satisfies Msg);
    });
  };
  dataStore.subscribe(broadcast);
  settingsStore.subscribe(() => {
    save('toona.settings', settingsStore.get());
    broadcast();
  });
  channel.on(async (raw) => {
    const msg = raw as Msg;
    if (msg.type === 'hello') broadcast();
    if (msg.type === 'call') {
      const fn = (api as unknown as Record<string, (...a: unknown[]) => unknown>)[msg.method];
      const value = fn ? await fn(...msg.args) : undefined;
      channel.post({ type: 'result', id: msg.id, value } satisfies Msg);
    }
  });
  backend.boot(hasKeepLogin());
} else {
  let callSeq = 1;
  const waiting = new Map<number, (v: unknown) => void>();
  channel.on((raw) => {
    const msg = raw as Msg;
    if (msg.type === 'state') {
      dataStore.replace(msg.data);
      settingsStore.replace(msg.settings);
    }
    if (msg.type === 'result') {
      waiting.get(msg.id)?.(msg.value);
      waiting.delete(msg.id);
    }
  });
  api = new Proxy({} as Api, {
    get: (_t, method: string) =>
      (...args: unknown[]) => {
        const id = callSeq++;
        channel.post({ type: 'call', id, method: method as BackendMethod, args } satisfies Msg);
        return new Promise((resolve) => waiting.set(id, resolve));
      },
  });
  channel.post({ type: 'hello' } satisfies Msg);
}

function hasKeepLogin() {
  try {
    return localStorage.getItem('toona.keepLogin') === '1';
  } catch {
    return false;
  }
}

export { api };
