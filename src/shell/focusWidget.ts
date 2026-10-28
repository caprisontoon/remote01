// 다른 위젯을 가리키기: 캔버스에 있으면 테두리를 잠깐 강조하고, 없으면 Dock에서 추가할 때처럼 캔버스에 띄운다.
// 모바일은 MobileApp이 focus를 보고 그 위젯 화면으로 이동한다.
import { layoutStore } from '../state/app';
import { uiStore } from '../state/ui';
import type { WidgetId } from '../types';

export const FOCUS_MS = 1600;

export function focusWidget(id: WidgetId) {
  const ui = uiStore.get();
  const shown = !!layoutStore.get().tiles[id] || ui.detached.some((d) => d.id === id);
  uiStore.set({ focus: { id, at: Date.now() }, ...(shown || ui.placing ? {} : { placing: id }) });
}
