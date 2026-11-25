// 설치형(Electron) 리모컨에서만 있는 기능의 브리지. 웹 리모컨에서는 window.toona가 없다.
import type { Donation, Shortcut, WidgetId } from './types';
import type { LiveStatus } from './api/toonation';

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'available'; version: string }
  | { state: 'downloading'; version: string; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string };

export interface DetachOptions {
  screenX: number;
  screenY: number;
  width: number;
  height: number;
  title: string;
}

export interface DragPoint {
  id: WidgetId;
  clientX: number;
  clientY: number;
}

export interface DesktopBridge {
  platform: string;
  window: {
    minimize(): void;
    toggleMaximize(): void;
    close(): void;
    setPinned(on: boolean): void;
  };
  widgets: {
    /** 위젯을 독립창으로 분리 (p19 드레그 아웃) */
    detach(id: WidgetId, opts: DetachOptions): void;
    /** 독립창 닫기 = 위젯 off */
    close(id: WidgetId): void;
    /** 독립창을 메인 캔버스로 되돌림 (p19 드레그 인) */
    reattach(id: WidgetId): void;
    setPinned(id: WidgetId, on: boolean): void;
    list(): Promise<{ id: WidgetId; pinned: boolean }[]>;
    onChanged(cb: (list: { id: WidgetId; pinned: boolean }[]) => void): () => void;
    /** 독립창 헤더 드래그 (창 이동 + 자석 + 메인 창 위 드래그 인 감지) */
    dragStart(screenX: number, screenY: number): void;
    dragMove(screenX: number, screenY: number): void;
    dragEnd(screenX: number, screenY: number): void;
    /** 메인 창: 독립창이 메인 창 위를 지나가는 중 (null = 벗어남) */
    onDragOver(cb: (p: DragPoint | null) => void): () => void;
    onDrop(cb: (p: DragPoint) => void): () => void;
  };
  sync: {
    post(msg: unknown): void;
    on(cb: (msg: unknown) => void): () => void;
  };
  /** 투네이션 실시간 후원 수신 (알림창 웹소켓) */
  toonation: {
    connect(alertboxUrlOrKey: string): Promise<{ ok: true } | { ok: false; error: string }>;
    disconnect(): Promise<void>;
    rawMessages(): Promise<unknown[]>;
    onStatus(cb: (s: LiveStatus) => void): () => void;
    onDonation(cb: (d: Donation) => void): () => void;
  };
  setShortcuts(list: Shortcut[]): Promise<{ id: string; ok: boolean }[]>;
  onShortcut(cb: (action: string) => void): () => void;
  /** 자동 업데이트 (electron/updater.ts). 설치된 앱에서만 새 버전을 확인한다 */
  updates: {
    status(): Promise<UpdateStatus>;
    /** 받기 시작. 다 받으면 앱이 닫히고 설치된 뒤 다시 실행된다 */
    download(): Promise<void>;
    /** [나중에]: 이번 실행 동안 다시 묻지 않는다 */
    dismiss(): Promise<void>;
    onStatus(cb: (s: UpdateStatus) => void): () => void;
  };
  openExternal(url: string): void;
  quit(): void;
}

declare global {
  interface Window {
    toona?: DesktopBridge;
  }
}

export const desktop: DesktopBridge | undefined = typeof window === 'undefined' ? undefined : window.toona;
export const isDesktop = !!desktop;

/** 새 창 링크. 설치형에서는 기본 브라우저로 연다. */
export function openUrl(url: string) {
  if (desktop) desktop.openExternal(url);
  else window.open(url, '_blank', 'noopener');
}
