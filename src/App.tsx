import { useEffect, useState } from 'react';
import { api, dataStore, detachedWidgetId, settingsStore } from './state/app';
import { uiStore } from './state/ui';
import { useStore } from './state/store';
import { useData } from './lib/hooks';
import { desktop, isDesktop } from './platform';
import type { ShortcutAction, WidgetId } from './types';
import { Toasts } from './components/ui';
import { Canvas } from './shell/Canvas';
import { DOCK_HEIGHT, Dock } from './shell/Dock';
import { Accounts, AdPopup, Expired, Login, Maintenance, Splash, Update } from './shell/Entry';
import { PresetsButton, PresetsPanel } from './shell/Presets';
import { SettingsModal } from './shell/Settings';
import { TitleBar } from './shell/TitleBar';
import { WallpaperModal } from './shell/Wallpaper';
import { DetachedWidget } from './shell/Detached';
import { MobileApp } from './mobile/MobileApp';
import { WIDGETS } from './widgets/meta';

const MOBILE_MAX = 768;

function useTheme() {
  const theme = useStore(settingsStore, (s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.body.style.background = theme === 'dark' ? '#0b0b0d' : '#eef1f5';
  }, [theme]);
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => !isDesktop && window.innerWidth <= MOBILE_MAX);
  useEffect(() => {
    if (isDesktop) return;
    const h = () => setMobile(window.innerWidth <= MOBILE_MAX);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mobile;
}

const SHORTCUT_RUN: Record<ShortcutAction, () => void> = {
  alertPause: () => api.togglePause('alert'),
  alertSkip: () => api.skip('alert'),
  drawingPause: () => api.togglePause('drawing'),
  drawingSkip: () => api.skip('drawing'),
  drawPause: () => api.togglePause('draw'),
  drawSkip: () => api.skip('draw'),
  videoAutoplay: () => api.setVideo({ autoplay: !dataStore.get().video.autoplay }),
  videoAudioOnly: () => api.setVideo({ audioOnly: !dataStore.get().video.audioOnly }),
};

export default function App() {
  useTheme();
  const mobile = useIsMobile();
  const phase = useData((d) => d.session.phase);
  const showAd = useData((d) => d.session.showAd);

  // 설치형: 독립창 목록 동기화 + 전역 단축키 실행
  useEffect(() => {
    if (!desktop || detachedWidgetId) return;
    desktop.widgets.list().then((list) => uiStore.set({ detached: list }));
    const offChanged = desktop.widgets.onChanged((list) => uiStore.set({ detached: list }));
    const offShortcut = desktop.onShortcut((action) => SHORTCUT_RUN[action as ShortcutAction]?.());
    desktop.setShortcuts(settingsStore.get().shortcuts);
    return () => {
      offChanged();
      offShortcut();
    };
  }, []);

  if (detachedWidgetId && detachedWidgetId in WIDGETS) return <DetachedWidget id={detachedWidgetId as WidgetId} />;

  if (phase !== 'ready') {
    return (
      <>
        {phase === 'splash' && <Splash />}
        {phase === 'login' && <Login />}
        {phase === 'accounts' && <Accounts />}
        {phase === 'maintenance' && <Maintenance />}
        {phase === 'update' && <Update />}
        {phase === 'expired' && <Expired />}
        <Toasts />
      </>
    );
  }

  return (
    <>
      {mobile ? <MobileApp /> : <PcRemote />}
      {showAd && <AdPopup />}
      <Toasts />
    </>
  );
}

/** PC 리모컨 (설치형 + PC 웹 공용). 웹은 창 분리·압정·단축키만 빠진다 (p6, p86). */
function PcRemote() {
  const pinned = useStore(settingsStore, (s) => s.dockPinned);
  const { settingsOpen, presetsOpen, wallpaperOpen } = useStore(uiStore, (s) => s);
  return (
    // 리모컨 전체 최소 크기: 그 이하로 줄이면 스크롤 (p9) ※ 디자인팀 확인 필요 — 임시 값
    <div className="h-full w-full overflow-auto">
      <div className="h-full min-w-[900px] min-h-[560px] flex flex-col bg-[#eef1f5] dark:bg-[#0b0b0d] text-slate-800 dark:text-gray-100">
        <TitleBar />
        <main className="relative flex-1 min-h-0">
          <Canvas bottomInset={pinned ? DOCK_HEIGHT + 8 : 0} />
        </main>
      </div>
      <Dock />
      <PresetsButton />
      {presetsOpen && <PresetsPanel />}
      {settingsOpen && <SettingsModal onClose={() => uiStore.set({ settingsOpen: false })} />}
      {wallpaperOpen && <WallpaperModal onClose={() => uiStore.set({ wallpaperOpen: false })} />}
    </div>
  );
}
