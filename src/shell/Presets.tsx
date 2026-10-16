import { Layers, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { layoutStore } from '../state/app';
import { uiStore } from '../state/ui';
import { useStore } from '../state/store';
import { normalize } from '../layout/grid';
import { useT } from '../lib/i18n';
import { Button, Modal } from '../components/ui';
import { uid } from '../api/mockData';
import { WIDGETS } from '../widgets/meta';
import type { Tiles, WidgetId } from '../types';

const countOf = (tiles: Tiles) => Object.keys(tiles).length;
const names = (tiles: Tiles) => (Object.keys(tiles) as WidgetId[]).map((id) => WIDGETS[id].title).join(', ');

/** 레이아웃 프리셋 (p12). 위젯 위치·크기를 저장했다가 불러온다. 사이드 모달, 바깥 클릭 시 닫힘. */
export function PresetsButton() {
  const t = useT();
  return (
    <button
      aria-label={t('레이아웃 프리셋')}
      onClick={() => uiStore.set({ presetsOpen: true })}
      className="fixed right-0 top-1/2 -translate-y-1/2 z-[9000] h-16 w-6 rounded-l-xl bg-white dark:bg-[#1c1c1e] border border-r-0 border-slate-200 dark:border-white/10 shadow-lg text-slate-400 hover:text-blue-600 hover:w-8 transition-all flex items-center justify-center"
    >
      <Layers size={15} />
    </button>
  );
}

export function PresetsPanel() {
  const t = useT();
  const { tiles, presets, activePresetId } = useStore(layoutStore, (s) => s);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const active = presets.find((p) => p.id === activePresetId);
  const close = () => uiStore.set({ presetsOpen: false });

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const p = { id: uid('preset'), name: trimmed, tiles, createdAt: Date.now() };
    layoutStore.set({ presets: [...presets, p], activePresetId: p.id });
    setName('');
    setNaming(false);
  };

  return (
    <div className="fixed inset-0 z-[15000]" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      <aside className="pop absolute right-0 top-0 bottom-0 w-[320px] max-w-full bg-white dark:bg-[#151517] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col">
        <div className="h-12 flex items-center justify-between px-4 border-b border-slate-100 dark:border-white/10">
          <h2 className="text-sm font-black flex items-center gap-2"><Layers size={16} className="text-blue-600" /> {t('레이아웃 프리셋')}</h2>
          <button aria-label={t('닫기')} onClick={close} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-5 text-xs">
          <section>
            <h3 className="font-bold text-slate-500 mb-2">{t('현재 상태')}</h3>
            <div className="rounded-xl border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 p-3">
              <div className="font-black">{active?.name ?? '사용자 설정'}</div>
              <div className="text-slate-500 mt-0.5">위젯 {countOf(tiles)}개 · {names(tiles)}</div>
            </div>
          </section>
          <section>
            <h3 className="font-bold text-slate-500 mb-2">{t('저장된 프리셋')}</h3>
            {presets.length === 0 && <p className="text-slate-400 py-4 text-center">저장된 프리셋이 없습니다.</p>}
            <ul className="space-y-2">
              {presets.map((p) => (
                <li key={p.id} className={`group rounded-xl border p-3 flex items-center gap-2 ${p.id === activePresetId ? 'border-blue-300 dark:border-blue-500/40' : 'border-slate-200 dark:border-white/10'}`}>
                  <button className="flex-1 min-w-0 text-left" onClick={() => { layoutStore.set({ tiles: normalize(p.tiles), activePresetId: p.id }); close(); }}>
                    <div className="font-bold truncate">{p.name}</div>
                    <div className="text-slate-500">위젯 {countOf(p.tiles)}개</div>
                  </button>
                  <button aria-label={`${p.name} 삭제`} onClick={() => layoutStore.set({ presets: presets.filter((x) => x.id !== p.id), activePresetId: activePresetId === p.id ? null : activePresetId })} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-white/10">
          <Button className="w-full h-10" onClick={() => setNaming(true)}>현재 레이아웃 저장</Button>
        </div>
      </aside>
      {naming && (
        <Modal
          title={t('프리셋 이름')}
          onClose={() => setNaming(false)}
          width="max-w-xs"
          footer={
            <>
              <Button variant="ghost" onClick={() => setNaming(false)}>{t('취소')}</Button>
              <Button disabled={!name.trim()} onClick={save}>{t('저장')}</Button>
            </>
          }
        >
          <div className="p-5">
            <input autoFocus maxLength={20} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} placeholder="예) 토크 방송" className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs" />
          </div>
        </Modal>
      )}
    </div>
  );
}
