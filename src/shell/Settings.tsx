import { ExternalLink, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, settingsStore } from '../state/app';
import { uiStore } from '../state/ui';
import { useStore } from '../state/store';
import { useData } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { desktop, isDesktop, openUrl } from '../platform';
import type { Shortcut, ShortcutAction } from '../types';
import { Button, Confirm, Modal, Toggle } from '../components/ui';
import { uid } from '../api/mockData';

type Tab = 'basic' | 'shortcut' | 'info';

/** 설정 (p14~16, 웹 p87, 모바일 p104~105) */
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>('basic');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'basic', label: '기본' },
    { id: 'shortcut', label: '단축키' },
    { id: 'info', label: '정보' },
  ];
  return (
    <Modal title={t('설정')} onClose={onClose} width="max-w-2xl">
      <div className="flex min-h-[380px]">
        <nav className="w-40 shrink-0 p-3 space-y-1 bg-[#f2f2f7] dark:bg-black/30">
          {tabs.map((x) => (
            <button key={x.id} onClick={() => setTab(x.id)} className={`w-full h-10 px-3 rounded-xl text-left text-[13px] font-medium ${tab === x.id ? 'bg-blue-600 text-white' : 'text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10'}`}>
              {t(x.label)}
            </button>
          ))}
        </nav>
        <div className="flex-1 p-5 overflow-auto">{tab === 'basic' ? <BasicSettings /> : tab === 'shortcut' ? <ShortcutSettings /> : <InfoSettings />}</div>
      </div>
    </Modal>
  );
}

export function BasicSettings() {
  const t = useT();
  const s = useStore(settingsStore, (x) => x);
  const [logout, setLogout] = useState(false);
  const row = 'flex items-center justify-between gap-4 py-3 border-b border-black/[0.08] dark:border-white/10';
  return (
    <div className="text-xs">
      <div className={row}>
        <span className="font-bold">{t('테마')}</span>
        <div className="segmented h-8 w-56 text-[13px]">
          <button aria-pressed={s.theme === 'light'} onClick={() => api.updateSettings({ theme: 'light' })}>{t('라이트 모드')}</button>
          <button aria-pressed={s.theme === 'dark'} onClick={() => api.updateSettings({ theme: 'dark' })}>{t('다크 모드')}</button>
        </div>
      </div>
      <div className={row}>
        <span className="font-bold">{t('텍스트 크기')}</span>
        <div className="segmented h-8 w-56 text-[13px]">
          {([100, 125, 150] as const).map((n) => (
            <button key={n} aria-pressed={s.textScale === n} onClick={() => api.updateSettings({ textScale: n })}>{n}%</button>
          ))}
        </div>
      </div>
      <div className={row}>
        <label htmlFor="lang" className="font-bold">{t('언어')}</label>
        <select id="lang" value={s.language} onChange={(e) => api.updateSettings({ language: e.target.value as 'ko' | 'en' })} className="h-8 px-3 rounded-full bg-[rgba(120,120,128,0.12)] dark:bg-[rgba(120,120,128,0.24)]">
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>
      <div className="py-3 border-b border-black/[0.08] dark:border-white/10 space-y-3">
        <span className="font-bold">{t('후원 차단 설정')}</span>
        <div className="flex items-center justify-between gap-4 pl-3">
          <span>{t('차단 버튼 표시')}</span>
          <Toggle on={s.showBlockButton} onChange={(v) => api.updateSettings({ showBlockButton: v })} label={t('차단 버튼 표시')} />
        </div>
        {/* '차단 버튼 표시'가 ON일 때만 노출 (p14 ②) */}
        {s.showBlockButton && (
          <div className="flex items-center justify-between gap-4 pl-3">
            <span>{t('후원 차단 시 허용/거절하지 않은 영상후원 상태 유지')}</span>
            <Toggle on={s.keepVideoOnBlock} onChange={(v) => api.updateSettings({ keepVideoOnBlock: v })} label="영상후원 상태 유지" />
          </div>
        )}
      </div>
      <div className="pt-4">
        <Button variant="ghost" onClick={() => setLogout(true)}>{t('로그아웃')}</Button>
      </div>
      {logout && <Confirm message={t('로그아웃 하시겠습니까?')} onConfirm={() => { setLogout(false); uiStore.set({ settingsOpen: false }); api.logout(); }} onCancel={() => setLogout(false)} />}
    </div>
  );
}

const ACTIONS: { id: ShortcutAction; label: string }[] = [
  { id: 'alertPause', label: '알림 일시 정지' },
  { id: 'alertSkip', label: '알림 스킵' },
  { id: 'drawingPause', label: '그림 일시 정지' },
  { id: 'drawingSkip', label: '그림 스킵' },
  { id: 'drawPause', label: '뽑기 일시 정지' },
  { id: 'drawSkip', label: '뽑기 스킵' },
  { id: 'videoAutoplay', label: '영상 자동 재생 켜기/끄기' },
  { id: 'videoAudioOnly', label: '영상 음성만 재생 켜기/끄기' },
];
const MAX_SHORTCUTS = 20;

/** 키 입력을 Electron accelerator 문자열로 (예: Ctrl+Shift+K) */
export function toAccelerator(e: Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey'>): string | null {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return null;
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Super');
  let key = e.code.startsWith('Key') ? e.code.slice(3) : e.code.startsWith('Digit') ? e.code.slice(5) : e.code.startsWith('Numpad') ? `num${e.code.slice(6)}` : e.key;
  if (key === ' ') key = 'Space';
  if (key.length === 1) key = key.toUpperCase();
  parts.push(key);
  return parts.join('+');
}

/** 단축키 (p15). 설치형 전용 — 웹에서는 안내 문구만 (p87). */
export function ShortcutSettings() {
  const shortcuts = useStore(settingsStore, (s) => s.shortcuts);
  const [failed, setFailed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!desktop) return;
    desktop.setShortcuts(shortcuts).then((res) => setFailed(new Set(res.filter((r) => !r.ok).map((r) => r.id))));
  }, [shortcuts]);

  if (!isDesktop) return <div className="h-full min-h-[200px] flex items-center justify-center text-xs text-slate-500">PC 버전에서만 이용할 수 있습니다.</div>;

  const update = (list: Shortcut[]) => api.updateSettings({ shortcuts: list });
  return (
    <div className="text-xs space-y-3">
      <p className="rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 p-3 leading-relaxed">
        리모컨이 실행되는 동안에는 설정 되어있는 단축키가 우선적으로 작동하여 기존 기능이 동작하지 않습니다. ex) ctrl+c로 설정 시 기존 복사하기 기능이 동작하지 않음.
        <br />타 프로그램과 단축키가 중첩 될 경우 정상적으로 작동되지 않을 수 있습니다.
      </p>
      <Button variant="ghost" disabled={shortcuts.length >= MAX_SHORTCUTS} onClick={() => update([...shortcuts, { id: uid('sc'), action: '', accelerator: '' }])}>
        <span className="inline-flex items-center gap-1"><Plus size={13} /> 단축키 추가</span>
      </Button>
      <ul className="space-y-2">
        {shortcuts.map((sc) => (
          <li key={sc.id} className="flex items-center gap-2">
            <select aria-label="기능 선택" value={sc.action} onChange={(e) => update(shortcuts.map((x) => (x.id === sc.id ? { ...x, action: e.target.value as ShortcutAction } : x)))} className="h-9 w-48 px-2 rounded-xl bg-[rgba(120,120,128,0.12)] dark:bg-[rgba(120,120,128,0.24)] outline-none focus:ring-2 focus:ring-blue-600/40">
              <option value="">기능 선택</option>
              {ACTIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
            <input
              aria-label="단축키"
              readOnly
              value={sc.accelerator}
              placeholder="단축키를 입력하세요."
              onKeyDown={(e) => {
                e.preventDefault();
                const acc = toAccelerator(e.nativeEvent);
                if (acc) update(shortcuts.map((x) => (x.id === sc.id ? { ...x, accelerator: acc } : x)));
              }}
              className={`h-9 flex-1 px-3 rounded-lg border bg-white dark:bg-white/5 font-mono ${failed.has(sc.id) ? 'border-red-400' : 'border-slate-200 dark:border-white/10'}`}
            />
            <button aria-label="항목 삭제" onClick={() => update(shortcuts.filter((x) => x.id !== sc.id))} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><X size={14} /></button>
          </li>
        ))}
      </ul>
      {failed.size > 0 && <p className="text-red-500">빨간 테두리의 단축키는 다른 프로그램이 사용 중이라 등록하지 못했습니다.</p>}
      <p className="text-slate-400">최대 {MAX_SHORTCUTS}개까지 추가할 수 있습니다.</p>
    </div>
  );
}

export function InfoSettings() {
  const version = useData((d) => d.version);
  const method = useData((d) => d.session.user?.loginMethod ?? '-');
  return (
    <div className="text-xs space-y-4">
      <h3 className="text-sm font-black">투네이션 크리에이터 리모컨</h3>
      <dl className="grid grid-cols-[96px_1fr] gap-y-2">
        <dt className="text-slate-500">리모컨 버전</dt><dd>{version}</dd>
        <dt className="text-slate-500">로그인 방법</dt><dd>{method}</dd>
        <dt className="text-slate-500">공식 홈페이지</dt>
        <dd><button className="text-blue-600 font-bold inline-flex items-center gap-1" onClick={() => openUrl('https://toon.at')}>https://toon.at <ExternalLink size={11} /></button></dd>
      </dl>
    </div>
  );
}
