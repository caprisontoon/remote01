import { ExternalLink, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, settingsStore } from '../state/app';
import { uiStore } from '../state/ui';
import { useStore } from '../state/store';
import { NARROW_WIDTH, useData, useViewportWidth } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { desktop, isDesktop, openUrl } from '../platform';
import type { Shortcut, ShortcutAction } from '../types';
import { Button, Confirm, IconButton, Modal, Segmented, Toggle, fieldClass } from '../components/ui';
import { uid } from '../api/mockData';

type Tab = 'basic' | 'shortcut' | 'live' | 'info';

/** 설정 (p14~16, 웹 p87, 모바일 p104~105) */
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>('basic');
  const narrow = useViewportWidth() < NARROW_WIDTH;
  const tabs: { id: Tab; label: string }[] = [
    { id: 'basic', label: '기본' },
    { id: 'shortcut', label: '단축키' },
    { id: 'live', label: '투네이션 연동' },
    { id: 'info', label: '정보' },
  ];
  return (
    <Modal title={t('설정')} onClose={onClose} width="max-w-2xl">
      {/* 좁은 창: 왼쪽 메뉴 대신 위쪽 밑줄 탭 */}
      <div className={`flex min-h-[380px] ${narrow ? 'flex-col' : ''}`}>
        <nav className={narrow ? 'flex shrink-0 px-2 border-b border-line overflow-x-auto [scrollbar-width:none]' : 'w-40 shrink-0 p-2 space-y-0.5 bg-canvas border-r border-line'}>
          {tabs.map((x) => (
            <button
              key={x.id}
              onClick={() => setTab(x.id)}
              className={
                narrow
                  ? `shrink-0 h-10 px-3 text-body whitespace-nowrap border-b-2 -mb-px ${tab === x.id ? 'border-live text-text font-semibold' : 'border-transparent text-text-secondary hover:text-text'}`
                  : `w-full h-[34px] px-3 rounded-control text-left text-body ${tab === x.id ? 'bg-brand-tint text-text font-semibold shadow-[inset_3px_0_0_rgb(var(--live))]' : 'text-text-secondary hover:text-text hover:bg-surface-raised'}`
              }
            >
              {t(x.label)}
            </button>
          ))}
        </nav>
        <div className={`flex-1 overflow-auto ${narrow ? 'p-4' : 'p-5'}`}>{tab === 'basic' ? <BasicSettings /> : tab === 'shortcut' ? <ShortcutSettings /> : tab === 'live' ? <LiveSettings /> : <InfoSettings />}</div>
      </div>
    </Modal>
  );
}

export function BasicSettings() {
  const t = useT();
  const s = useStore(settingsStore, (x) => x);
  const [logout, setLogout] = useState(false);
  const row = 'flex items-center justify-between gap-4 py-3 border-b border-line-subtle';
  return (
    <div className="text-body text-text">
      <div className={row}>
        <span className="font-semibold">{t('테마')}</span>
        <Segmented
          className="w-56"
          value={s.theme}
          onChange={(theme) => api.updateSettings({ theme })}
          options={[{ value: 'light', label: t('라이트 모드') }, { value: 'dark', label: t('다크 모드') }]}
        />
      </div>
      <div className={row}>
        <span className="font-semibold">{t('텍스트 크기')}</span>
        <Segmented
          className="w-56"
          value={s.textScale}
          onChange={(textScale) => api.updateSettings({ textScale })}
          options={([100, 125, 150] as const).map((n) => ({ value: n, label: `${n}%` }))}
        />
      </div>
      <div className={row}>
        <label htmlFor="lang" className="font-semibold">{t('언어')}</label>
        <select id="lang" value={s.language} onChange={(e) => api.updateSettings({ language: e.target.value as 'ko' | 'en' })} className={`${fieldClass} w-56`}>
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>
      <div className="py-3 border-b border-line-subtle space-y-3">
        <span className="font-semibold">{t('후원 차단 설정')}</span>
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
        <Button variant="secondary" onClick={() => setLogout(true)}>{t('로그아웃')}</Button>
      </div>
      {logout && <Confirm danger confirmLabel={t('로그아웃')} message={t('로그아웃 하시겠습니까?')} onConfirm={() => { setLogout(false); uiStore.set({ settingsOpen: false }); api.logout(); }} onCancel={() => setLogout(false)} />}
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

  if (!isDesktop) return <div className="h-full min-h-[200px] flex items-center justify-center text-body text-text-secondary">PC 버전에서만 이용할 수 있습니다.</div>;

  const update = (list: Shortcut[]) => api.updateSettings({ shortcuts: list });
  return (
    <div className="text-body text-text space-y-3">
      <p className="rounded-card bg-surface-raised border border-warning/60 text-text-body p-3 leading-relaxed">
        리모컨이 실행되는 동안에는 설정 되어있는 단축키가 우선적으로 작동하여 기존 기능이 동작하지 않습니다. ex) ctrl+c로 설정 시 기존 복사하기 기능이 동작하지 않음.
        <br />타 프로그램과 단축키가 중첩 될 경우 정상적으로 작동되지 않을 수 있습니다.
      </p>
      <Button variant="secondary" disabled={shortcuts.length >= MAX_SHORTCUTS} onClick={() => update([...shortcuts, { id: uid('sc'), action: '', accelerator: '' }])}>
        <span className="inline-flex items-center gap-1"><Plus size={13} /> 단축키 추가</span>
      </Button>
      <ul className="space-y-2">
        {shortcuts.map((sc) => (
          <li key={sc.id} className="flex items-center gap-2">
            <select aria-label="기능 선택" value={sc.action} onChange={(e) => update(shortcuts.map((x) => (x.id === sc.id ? { ...x, action: e.target.value as ShortcutAction } : x)))} className={`${fieldClass} w-48`}>
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
              className={`${fieldClass} flex-1 font-num ${failed.has(sc.id) ? '!border-danger' : ''}`}
            />
            <IconButton label="항목 삭제" onClick={() => update(shortcuts.filter((x) => x.id !== sc.id))} className="hover:!text-danger"><X size={14} /></IconButton>
          </li>
        ))}
      </ul>
      {failed.size > 0 && <p className="text-danger">빨간 테두리의 단축키는 다른 프로그램이 사용 중이라 등록하지 못했습니다.</p>}
      <p className="text-text-tertiary">최대 {MAX_SHORTCUTS}개까지 추가할 수 있습니다.</p>
    </div>
  );
}

export function InfoSettings() {
  const version = useData((d) => d.version);
  const method = useData((d) => d.session.user?.loginMethod ?? '-');
  return (
    <div className="text-body text-text space-y-4">
      <h3 className="text-title-widget">투네이션 크리에이터 리모컨</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="text-text-secondary">리모컨 버전</dt><dd>{version} <span className="text-text-tertiary">({import.meta.env.VITE_BUILD})</span></dd>
        <dt className="text-text-secondary">로그인 방법</dt><dd>{method}</dd>
        <dt className="text-text-secondary">공식 홈페이지</dt>
        <dd><button className="text-link font-semibold inline-flex items-center gap-1" onClick={() => openUrl('https://toon.at')}>https://toon.at <ExternalLink size={11} /></button></dd>
      </dl>
    </div>
  );
}

/**
 * 투네이션 연동: 알림창 웹소켓으로 실제 후원을 받아 후원 리스트에 보여준다.
 * 일시정지·스킵 같은 제어는 아직 서버 프로토콜이 확인되지 않아 연동되지 않는다.
 */
export function LiveSettings() {
  const saved = useStore(settingsStore, (x) => x.liveAlertbox);
  const live = useData((d) => d.live);
  const [input, setInput] = useState(saved);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [raw, setRaw] = useState<string | null>(null);

  if (!desktop) return <div className="h-full min-h-[200px] flex items-center justify-center text-body text-text-secondary">설치형(PC) 리모컨에서만 이용할 수 있습니다.</div>;

  const connect = async () => {
    setBusy(true);
    setError(null);
    const res = await desktop!.toonation.connect(input);
    setBusy(false);
    if (res.ok) api.updateSettings({ liveAlertbox: input.trim() });
    else setError(res.error);
  };
  const disconnect = async () => {
    await desktop!.toonation.disconnect();
    api.updateSettings({ liveAlertbox: '' });
  };
  const status =
    live.state === 'connected' ? { dot: 'bg-live', text: `연결됨 · 받은 후원 ${live.received}건` }
    : live.state === 'connecting' ? { dot: 'bg-warning', text: '연결 중…' }
    : live.state === 'error' ? { dot: 'bg-danger', text: live.message + (live.retrying ? ' (자동 재시도)' : '') }
    : { dot: 'bg-text-tertiary', text: '연결 안 됨 · 가상 후원으로 체험 중' };

  return (
    <div className="text-body text-text space-y-4">
      <p className="text-text-secondary leading-relaxed">
        투네이션 <b>통합 알림창(알림박스) URL</b>을 넣으면 실제 후원이 후원 리스트에 실시간으로 들어옵니다.
        URL은 투네이션 크리에이터 페이지 &gt; 통합 알림창에서 복사할 수 있습니다.
      </p>
      <div className="flex items-center gap-2 rounded-card bg-surface-raised border border-line px-4 py-3">
        <span className={`w-2.5 h-2.5 rounded-pill ${status.dot}`} />
        <span className="font-medium break-all">{status.text}</span>
      </div>
      <div className="flex gap-2">
        <input
          type="password"
          autoComplete="off"
          aria-label="알림창 URL"
          placeholder="https://toon.at/widget/alertbox/…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`${fieldClass} flex-1 h-[34px]`}
        />
        {live.state === 'off' ? (
          <Button disabled={!input.trim() || busy} onClick={connect}>{busy ? '연결 중…' : '연결'}</Button>
        ) : (
          <Button variant="secondary" onClick={disconnect}>연결 해제</Button>
        )}
      </div>
      {error && <p className="text-danger">{error}</p>}
      <ul className="text-caption text-text-tertiary space-y-1 list-disc pl-4">
        <li>알림창 URL은 비밀번호처럼 다뤄 주세요. 이 PC에만 저장되고 다음 실행 때 자동으로 연결됩니다.</li>
        <li>지금은 <b>후원 받기</b>만 연동됩니다. 일시정지·스킵·차단 같은 제어는 리모컨 안에서만 바뀌고 실제 방송에는 아직 반영되지 않습니다.</li>
        <li>연결되면 체험용 가상 후원은 멈추고 실제 후원만 보입니다.</li>
      </ul>
      {live.state === 'connected' && (
        <div>
          <Button variant="secondary" onClick={async () => setRaw(JSON.stringify(await desktop!.toonation.rawMessages(), null, 2))}>받은 원본 메시지 보기 (진단용)</Button>
          {raw && <pre className="mt-2 max-h-48 overflow-auto rounded-card bg-surface-raised border border-line p-3 text-micro font-num select-text whitespace-pre-wrap">{raw}</pre>}
        </div>
      )}
    </div>
  );
}
