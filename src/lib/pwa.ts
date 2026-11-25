// 웹앱(PWA) 설치 지원. 설치형(Electron)과 개발 서버에서는 쓰지 않는다.
// 브라우저가 "설치할 수 있음"을 알리는 beforeinstallprompt 이벤트는 앱이 뜨자마자 한 번 오므로 여기서 받아 둔다.
import { useEffect, useState } from 'react';
import { isDesktop } from '../platform';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export const isStandalone = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.matchMedia?.('(display-mode: window-controls-overlay)').matches);

export function setupPwa() {
  if (isDesktop || typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
  // 서비스 워커: https 배포본에서만 (개발 서버는 화면이 바로 바뀌어야 하므로 제외)
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !import.meta.env.DEV) {
    void navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  }
}

/** 지금 설치할 수 있는지(설치 버튼 표시)와 설치 실행 */
export function useInstall() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => void listeners.delete(fn);
  }, []);
  return {
    canInstall: !!deferred,
    installed: isStandalone(),
    install: async () => {
      if (!deferred) return false;
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;
      notify();
      return outcome === 'accepted';
    },
  };
}
