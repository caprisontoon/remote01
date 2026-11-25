// 리모컨 관리자 웹. 사용자 관리(이용자 현황·버전 현황·회원 관리·제재 내역)와 점검(점검 일정)으로 나뉜다.
import { BarChart3, Ban, Layers, Moon, Sun, Users, Wrench } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useHashRoute, type Route } from './route';
import logoLight from '../assets/brand/toonation-logo-primary-64.png';
import logoDark from '../assets/brand/toonation-logo-primary-dark-64.png';
import { IconButton } from '../components/primitives';
import { Pill, Toasts } from './ui';
import { UsagePage } from './pages/UsagePage';
import { VersionsPage } from './pages/VersionsPage';
import { MembersPage } from './pages/MembersPage';
import { SanctionsPage } from './pages/SanctionsPage';
import { MaintenancePage } from './pages/MaintenancePage';

const MENU: { group: string; items: { route: Route; label: string; icon: ReactNode }[] }[] = [
  {
    group: '사용자 관리',
    items: [
      { route: 'usage', label: '설치형 이용자 현황', icon: <BarChart3 size={16} /> },
      { route: 'versions', label: '버전 현황', icon: <Layers size={16} /> },
      { route: 'members', label: '회원 관리', icon: <Users size={16} /> },
      { route: 'sanctions', label: '제재 내역', icon: <Ban size={16} /> },
    ],
  },
  {
    group: '점검',
    items: [{ route: 'maintenance', label: '점검 일정', icon: <Wrench size={16} /> }],
  },
];
/** 관리자 웹은 데이터를 오래 보는 화면이라 라이트가 기본이다. 고른 값은 이 브라우저에 저장한다. */
function useAdminTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('toona.admin.theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('toona.admin.theme', theme);
    } catch {
      /* noop */
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

export default function AdminApp() {
  const { route, param } = useHashRoute();
  const [theme, setTheme] = useAdminTheme();

  const nav = (layout: 'side' | 'top') =>
    MENU.map((g) => (
      <div key={g.group} className={layout === 'side' ? 'mb-5' : 'flex items-center gap-1 shrink-0'}>
        {layout === 'side' && <p className="px-3 mb-1.5 text-micro font-semibold text-text-tertiary">{g.group}</p>}
        {g.items.map((i) => {
          const on = route === i.route;
          return (
            <a
              key={i.route}
              href={`#/${i.route}`}
              aria-current={on ? 'page' : undefined}
              className={`flex items-center gap-2 h-9 px-3 rounded-control text-body whitespace-nowrap transition-colors ${
                on ? 'bg-brand-tint text-brand-hover dark:text-link font-semibold ring-1 ring-inset ring-brand-tint-line' : 'text-text-secondary hover:text-text hover:bg-surface-raised'
              }`}
            >
              {i.icon}
              {i.label}
            </a>
          );
        })}
      </div>
    ));

  return (
    <div className="h-full flex flex-col md:flex-row bg-canvas text-text select-text">
      {/* 넓은 화면: 왼쪽 메뉴 */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-surface border-r border-line">
        <div className="h-16 px-5 flex flex-col justify-center gap-1 border-b border-line">
          <img src={theme === 'dark' ? logoDark : logoLight} alt="toonation" className="h-5 w-fit" />
          <span className="text-caption font-bold text-text-secondary">리모컨 관리자</span>
        </div>
        <nav className="flex-1 overflow-auto p-3" aria-label="관리 메뉴">
          {nav('side')}
        </nav>
        <div className="p-4 border-t border-line flex items-center gap-2">
          <span className="w-7 h-7 rounded-pill bg-brand-tint text-brand-hover dark:text-link flex items-center justify-center text-caption font-bold">운</span>
          <span className="text-body font-semibold">운영자</span>
          <IconButton label={theme === 'dark' ? '라이트 모드' : '다크 모드'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="ml-auto">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </IconButton>
        </div>
      </aside>

      {/* 좁은 화면: 위쪽 메뉴 */}
      <header className="md:hidden shrink-0 bg-surface border-b border-line">
        <div className="h-12 px-4 flex items-center gap-2">
          <img src={theme === 'dark' ? logoDark : logoLight} alt="toonation" className="h-[18px] w-auto" />
          <span className="text-body font-bold text-text-secondary">리모컨 관리자</span>
          <IconButton label={theme === 'dark' ? '라이트 모드' : '다크 모드'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="ml-auto">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </IconButton>
        </div>
        <nav className="flex gap-3 px-3 pb-2 overflow-x-auto [scrollbar-width:none]" aria-label="관리 메뉴">
          {nav('top')}
        </nav>
      </header>

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-6">
          <div className="mb-4 flex justify-end">
            <Pill tone="warning">목업 데이터 · 실서버 연동 전</Pill>
          </div>
          {route === 'usage' && <UsagePage />}
          {route === 'versions' && <VersionsPage />}
          {route === 'members' && <MembersPage openId={param} />}
          {route === 'sanctions' && <SanctionsPage />}
          {route === 'maintenance' && <MaintenancePage />}
        </div>
      </main>
      <Toasts />
    </div>
  );
}
