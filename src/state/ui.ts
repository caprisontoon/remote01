import type { WidgetId } from '../types';
import { createStore } from './store';

/** 창 하나 안에서만 쓰는 화면 상태 (공유·저장하지 않음). */
export interface UiState {
  /** Dock에서 추가해 캔버스 중앙에 떠 있는 위젯 (p21) */
  placing: WidgetId | null;
  /** 위젯을 끌고 있는 중 — Dock은 압정과 무관하게 숨긴다 */
  dragging: boolean;
  /** 설치형: 독립창으로 분리된 위젯 */
  detached: { id: WidgetId; pinned: boolean }[];
  settingsOpen: boolean;
  presetsOpen: boolean;
  wallpaperOpen: boolean;
}

export const uiStore = createStore<UiState>({
  placing: null,
  dragging: false,
  detached: [],
  settingsOpen: false,
  presetsOpen: false,
  wallpaperOpen: false,
});
