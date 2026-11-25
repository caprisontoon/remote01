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
import { Accounts, AdPopup, Expired, Login, Maintenance, Splash, Suspended, Update } from './shell/Entry';
import { PresetsButton, PresetsPanel } from './shell/Presets';
import { SettingsModal } from './shell/Settings';
import { TitleBar } from './shell/TitleBar';
import { WallpaperModal } from './shell/Wallpaper';
import { DetachedWidget } from './shell/Detached';
import { MobileApp } from './mobile/MobileApp';
import { WIDGETS } from './widgets/meta';

const MOBILE_MAX = 768;

/** 테마(다크/라이트)와 텍스트 크기(100/125/150%, p14)를 html에 적용한다. 색은 CSS 변수, 글자는 rem이라 여기 하나로 바뀐다. */
function useTheme() {
  const theme = useStore(settingsStore, (s) => s.theme);
  const scale = useStore(settingsStore, (s) => s.textScale);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  useEffect(() => {
    document.documentElement.style.fontSize = `${scale}%`;
  }, [scale]);
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
    // 투네이션 실시간 후원 수신: 상태·후원을 공유 상태로 넣는다
    const offLiveStatus = desktop.toonation.onStatus(api.setLiveStatus);
    const offLiveDonation = desktop.toonation.onDonation(api.ingestLive);
    return () => {
      offChanged();
      offShortcut();
      offLiveStatus();
      offLiveDonation();
    };
  }, []);

  // 저장된 알림창 키가 있으면 로그인 후 자동 연결
  useEffect(() => {
    if (!desktop || detachedWidgetId || phase !== 'ready') return;
    const key = settingsStore.get().liveAlertbox;
    if (key) void desktop.toonation.connect(key);
    return () => void desktop?.toonation.disconnect();
  }, [phase]);

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
        {phase === 'suspended' && <Suspended />}
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
    // 리모컨 전체 최소 크기: 그 이하로 줄이면 스크롤 (p9). 설치형 창 최소 너비(400px, 모바일 화면 정도)와 맞춘다.
    <div className="h-full w-full overflow-auto">
      <div className="h-full min-w-[400px] min-h-[560px] flex flex-col pt-2 px-1.5 bg-canvas text-text">
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
