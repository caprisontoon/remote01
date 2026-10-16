import { ArrowLeft, ChevronRight, Command, Image, Pause, Settings, SkipForward, Volume2, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { api } from '../state/app';
import { useData } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { openUrl } from '../platform';
import type { WidgetId } from '../types';
import { Badge, Confirm } from '../components/ui';
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
    <div className="h-full flex flex-col bg-white dark:bg-[#000000] text-black dark:text-white">
      <header className="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-slate-100 dark:border-white/10">
        <button onClick={() => openUrl('https://toon.at')} aria-label="투네이션 홈페이지 새 창"><Logo className="text-sm" /></button>
        <div className="ml-auto flex items-center">
          <AlarmButton />
          <button aria-label={t('설정')} onClick={() => setPage({ kind: 'settings' })} className="p-2 rounded-lg text-slate-500"><Settings size={18} /></button>
        </div>
      </header>
      {/* 공지: 누르면 고객센터 공지로 새 창 (p93 ②) */}
      <button onClick={() => notice.url && openUrl(notice.url)} className="h-8 shrink-0 flex items-center gap-2 px-3 text-[11px] font-semibold text-left" style={{ background: notice.background, color: notice.color }}>
        <Volume2 size={13} className="shrink-0" /> <span className="truncate">{notice.text}</span>
      </button>

      <main className="flex-1 min-h-0">
        <DonationList />
      </main>

      {/* 기능 버튼 (p107) */}
      <nav className="shrink-0 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-full glass">
        <button onClick={() => setSheet('widgets')} className="relative h-12 rounded-full text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center gap-2 font-medium text-[15px]">
          <Command size={18} /> 리모컨 위젯
          <Badge count={pendingCount} className="absolute top-1.5 right-3" />
        </button>
        <button onClick={() => setSheet('quick')} className={`h-12 rounded-full flex items-center justify-center gap-2 font-medium text-[15px] ${paused ? 'bg-red-500 text-white' : 'text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10'}`}>
          <Pause size={16} /><SkipForward size={16} /> {t('퀵 제어')}
        </button>
        </div>
      </nav>

      {sheet === 'widgets' && (
        <Sheet title="리모컨 위젯" onClose={() => setSheet(null)}>
          <ul className="divide-y divide-black/[0.08] dark:divide-white/10">
            {MOBILE_ORDER.map((id) => {
              const m = WIDGETS[id];
              const Icon = m.icon;
              return (
                <li key={id}>
                  <button onClick={() => { setSheet(null); setPage({ kind: 'widget', id }); }} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                    <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 flex items-center justify-center"><Icon size={18} /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold">{t(m.title)}</span>
                      <span className="block text-[11px] text-slate-500">{m.description}</span>
                    </span>
                    {id === 'pending' && <Badge count={pendingCount} />}
                    <ChevronRight size={16} className="text-slate-300" />
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
    <div className="fixed inset-0 z-[15000] bg-black/40 flex items-end" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pop w-full max-h-[80vh] overflow-auto rounded-t-sheet bg-white dark:bg-[#1c1c1e] shadow-sheet pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 flex items-center justify-between h-14 px-5 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur">
          <h2 className="text-sm font-black">{title}</h2>
          <button aria-label="닫기" onClick={onClose} className="p-1.5 text-slate-400"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FullPage({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[14000] flex flex-col bg-white dark:bg-[#000000]">
      <header className="h-12 shrink-0 flex items-center gap-2 px-2 border-b border-slate-100 dark:border-white/10">
        <button aria-label="뒤로 가기" onClick={onBack} className="p-2"><ArrowLeft size={18} /></button>
        <h2 className="text-sm font-black">{title}</h2>
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
  const item = 'w-full flex items-center justify-between px-4 h-12 text-sm font-semibold border-b border-black/[0.08] dark:border-white/10';
  return (
    <FullPage title={t('설정')} onBack={onBack}>
      <button className={item} onClick={() => onOpen('basic')}>{t('기본')} <ChevronRight size={16} className="text-slate-300" /></button>
      <button className={item} onClick={() => onOpen('shortcut')}>{t('단축키')} <ChevronRight size={16} className="text-slate-300" /></button>
      <button className={item} onClick={() => onOpen('info')}>{t('정보')} <ChevronRight size={16} className="text-slate-300" /></button>
      <button className={item} onClick={() => setWallpaper(true)}><span className="flex items-center gap-2"><Image size={16} /> {t('벽지')}</span> <ChevronRight size={16} className="text-slate-300" /></button>
      <button className={`${item} text-red-500`} onClick={() => setLogout(true)}>{t('로그아웃')}</button>
      {wallpaper && <WallpaperModal onClose={() => setWallpaper(false)} />}
      {logout && <Confirm message={t('로그아웃 하시겠습니까?')} onConfirm={() => { setLogout(false); api.logout(); }} onCancel={() => setLogout(false)} />}
    </FullPage>
  );
}
