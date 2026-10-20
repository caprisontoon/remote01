import { ArrowLeft, ChevronRight, Command, Image, Pause, Settings, SkipForward, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { api } from '../state/app';
import { useData } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { openUrl } from '../platform';
import type { WidgetId } from '../types';
import { Badge, Confirm, IconButton } from '../components/ui';
import { WidgetErrorBoundary } from '../components/ErrorBoundary';
import { AlarmButton, Logo } from '../shell/TitleBar';
import { BasicSettings, InfoSettings, ShortcutSettings } from '../shell/Settings';
import { WallpaperModal } from '../shell/Wallpaper';
import DonationList from '../widgets/donations/DonationList';
import QuickControl from '../widgets/QuickControl';
import { MOBILE_ORDER, WIDGETS } from '../widgets/meta';
import { WIDGET_COMPONENTS } from '../widgets/registry';

type Page = { kind: 'widget'; id: WidgetId } | { kind: 'settings' } | { kind: 'setting'; tab: 'basic' | 'shortcut' | 'info' } | null;

/**
 * 모바일 웹 리모컨 (p88~112).
 * 후원 리스트가 전체 화면, 하단 [⌘ 리모컨 위젯] / [퀵 제어]로 나머지 위젯을 연다.
 */
export function MobileApp() {
  const t = useT();
  const notice = useData((d) => d.notice);
  const pendingCount = useData((d) => d.pending.length);
  const paused = useData((d) => d.paused.alert);
  const [sheet, setSheet] = useState<'widgets' | 'quick' | null>(null);
  const [page, setPage] = useState<Page>(null);

  return (
    <div className="h-full flex flex-col bg-surface text-text">
      <header className="h-12 shrink-0 flex items-center gap-2 px-3 bg-canvas border-b border-line">
        <button onClick={() => openUrl('https://toon.at')} aria-label="투네이션 홈페이지 새 창"><Logo className="text-[0.9375rem]" /></button>
        <div className="ml-auto flex items-center gap-1.5">
          <AlarmButton />
          <button aria-label={t('설정')} onClick={() => setPage({ kind: 'settings' })} className="w-9 h-9 rounded-control border border-line flex items-center justify-center text-text-secondary hover:text-text"><Settings size={17} /></button>
        </div>
      </header>
      {/* 공지: 누르면 고객센터 공지로 새 창 (p93 ②) */}
      <button onClick={() => notice.url && openUrl(notice.url)} className="h-9 shrink-0 flex items-center gap-2 px-3 text-caption font-medium text-left bg-brand-tint border-b border-brand-tint-line text-text">
        <span className="shrink-0 px-1.5 py-0.5 rounded-tag bg-brand text-text-on-brand text-micro font-bold">공지</span> <span className="truncate">{notice.text}</span>
      </button>

      <main className="flex-1 min-h-0">
        <DonationList />
      </main>

      {/* 기능 버튼 (p107) */}
      <nav className="shrink-0 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-canvas border-t border-line">
        <div className="grid grid-cols-2 gap-1.5">
        <button onClick={() => setSheet('widgets')} className="relative h-11 rounded-control bg-surface-raised border border-line-strong text-text hover:bg-surface-sunken flex items-center justify-center gap-2 font-semibold text-body">
          <Command size={18} /> 리모컨 위젯
          <Badge count={pendingCount} className="absolute top-1.5 right-3" />
        </button>
        <button onClick={() => setSheet('quick')} className={`h-11 rounded-control border flex items-center justify-center gap-2 font-semibold text-body ${paused ? 'bg-warning border-warning text-text-on-warning' : 'bg-surface-raised border-line-strong text-text hover:bg-surface-sunken'}`}>
          <Pause size={16} /><SkipForward size={16} /> {t('퀵 제어')}
        </button>
        </div>
      </nav>

      {sheet === 'widgets' && (
        <Sheet title="리모컨 위젯" onClose={() => setSheet(null)}>
          <ul>
            {MOBILE_ORDER.map((id) => {
              const m = WIDGETS[id];
              const Icon = m.icon;
              return (
                <li key={id}>
                  <button onClick={() => { setSheet(null); setPage({ kind: 'widget', id }); }} className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-line-subtle hover:bg-surface-sunken">
                    <span className="w-9 h-9 rounded-dock-item bg-surface-raised border border-line text-text-secondary flex items-center justify-center"><Icon size={18} /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-body font-semibold text-text">{t(m.title)}</span>
                      <span className="block text-caption text-text-secondary">{m.description}</span>
                    </span>
                    {id === 'pending' && <Badge count={pendingCount} />}
                    <ChevronRight size={16} className="text-text-tertiary" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Sheet>
      )}
      {sheet === 'quick' && (
        <Sheet title={t('퀵 제어')} onClose={() => setSheet(null)}>
          <div className="h-[220px]"><QuickControl /></div>
        </Sheet>
      )}

      {page?.kind === 'widget' && <WidgetPage id={page.id} onBack={() => setPage(null)} />}
      {page?.kind === 'settings' && <SettingsPage onBack={() => setPage(null)} onOpen={(tab) => setPage({ kind: 'setting', tab })} />}
      {page?.kind === 'setting' && (
        <FullPage title={t({ basic: '기본', shortcut: '단축키', info: '정보' }[page.tab])} onBack={() => setPage({ kind: 'settings' })}>
          <div className="p-4">{page.tab === 'basic' ? <BasicSettings /> : page.tab === 'shortcut' ? <ShortcutSettings /> : <InfoSettings />}</div>
        </FullPage>
      )}
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-sheet bg-scrim flex items-end" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pop w-full max-h-[80vh] overflow-auto rounded-t-widget bg-surface border-t border-line shadow-float text-text pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 z-10 flex items-center justify-between h-12 pl-4 pr-2 bg-surface border-b border-line">
          <h2 className="text-title-widget">{title}</h2>
          <IconButton label="닫기" onClick={onClose}><X size={18} /></IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

function FullPage({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[14000] flex flex-col bg-surface text-text">
      <header className="h-12 shrink-0 flex items-center gap-2 px-2 bg-canvas border-b border-line">
        <button aria-label="뒤로 가기" onClick={onBack} className="p-2 text-text-secondary hover:text-text"><ArrowLeft size={18} /></button>
        <h2 className="text-title-widget">{title}</h2>
      </header>
      <div className="flex-1 min-h-0 overflow-auto">{children}</div>
    </div>
  );
}

function WidgetPage({ id, onBack }: { id: WidgetId; onBack: () => void }) {
  const t = useT();
  const Body = WIDGET_COMPONENTS[id];
  return (
    <FullPage title={t(WIDGETS[id].title)} onBack={onBack}>
      <div className="h-full"><WidgetErrorBoundary name={id}><Body /></WidgetErrorBoundary></div>
    </FullPage>
  );
}

/** 모바일 메뉴 > 설정 (p104): 기본 / 단축키 / 정보 / 벽지 / 로그아웃 */
function SettingsPage({ onBack, onOpen }: { onBack: () => void; onOpen: (tab: 'basic' | 'shortcut' | 'info') => void }) {
  const t = useT();
  const [wallpaper, setWallpaper] = useState(false);
  const [logout, setLogout] = useState(false);
  const item = 'w-full flex items-center justify-between px-4 h-12 text-body font-semibold border-b border-line-subtle hover:bg-surface-sunken';
  return (
    <FullPage title={t('설정')} onBack={onBack}>
      <button className={item} onClick={() => onOpen('basic')}>{t('기본')} <ChevronRight size={16} className="text-text-tertiary" /></button>
      <button className={item} onClick={() => onOpen('shortcut')}>{t('단축키')} <ChevronRight size={16} className="text-text-tertiary" /></button>
      <button className={item} onClick={() => onOpen('info')}>{t('정보')} <ChevronRight size={16} className="text-text-tertiary" /></button>
      <button className={item} onClick={() => setWallpaper(true)}><span className="flex items-center gap-2"><Image size={16} /> {t('벽지')}</span> <ChevronRight size={16} className="text-text-tertiary" /></button>
      <button className={`${item} text-danger`} onClick={() => setLogout(true)}>{t('로그아웃')}</button>
      {wallpaper && <WallpaperModal onClose={() => setWallpaper(false)} />}
      {logout && <Confirm message={t('로그아웃 하시겠습니까?')} onConfirm={() => { setLogout(false); api.logout(); }} onCancel={() => setLogout(false)} />}
    </FullPage>
  );
}
