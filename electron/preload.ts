// 렌더러에 노출하는 설치형 전용 API (window.toona). src/platform.ts의 DesktopBridge와 같은 모양이다.
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

const on = <T,>(channel: string, cb: (payload: T) => void) => {
  const h = (_e: IpcRendererEvent, payload: T) => cb(payload);
  ipcRenderer.on(channel, h);
  return () => {
    ipcRenderer.removeListener(channel, h);
  };
};

contextBridge.exposeInMainWorld('toona', {
  platform: process.platform,
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.send('window:toggleMaximize'),
    close: () => ipcRenderer.send('window:close'),
    setPinned: (on: boolean) => ipcRenderer.send('window:setPinned', on),
  },
  widgets: {
    detach: (id: string, opts: unknown) => ipcRenderer.send('widgets:detach', id, opts),
    close: (id: string) => ipcRenderer.send('widgets:close', id),
    reattach: (id: string) => ipcRenderer.send('widgets:reattach', id),
    setPinned: (id: string, pinned: boolean) => ipcRenderer.send('widgets:setPinned', id, pinned),
    list: () => ipcRenderer.invoke('widgets:list'),
    onChanged: (cb: (list: unknown) => void) => on('widgets:changed', cb),
    dragStart: (x: number, y: number) => ipcRenderer.send('widgets:dragStart', x, y),
    dragMove: (x: number, y: number) => ipcRenderer.send('widgets:dragMove', x, y),
    dragEnd: (x: number, y: number) => ipcRenderer.send('widgets:dragEnd', x, y),
    onDragOver: (cb: (p: unknown) => void) => on('widgets:dragOver', cb),
    onDrop: (cb: (p: unknown) => void) => on('widgets:drop', cb),
  },
  sync: {
    post: (msg: unknown) => ipcRenderer.send('sync:post', msg),
    on: (cb: (msg: unknown) => void) => on('sync:msg', cb),
  },
  setShortcuts: (list: unknown) => ipcRenderer.invoke('shortcuts:set', list),
  onShortcut: (cb: (action: string) => void) => on('shortcut', cb),
  openExternal: (url: string) => ipcRenderer.send('app:openExternal', url),
  quit: () => ipcRenderer.send('app:quit'),
});
