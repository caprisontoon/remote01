import { Bell, Copy, Minus, Pin, Settings, Square, Volume2, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { api } from '../state/app';
import { uiStore } from '../state/ui';
import { relativeTime } from '../lib/donation';
import { useData, useNow, useOutsideClick } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { desktop, openUrl } from '../platform';
import { Badge, Tooltip } from '../components/ui';

export const TITLEBAR_HEIGHT = 44;

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-1 font-black tracking-tight ${className}`}>
      <span className="flex items-center gap-[2px]" aria-hidden>
        <span className="text-blue-500 text-lg leading-none">+</span>
        <span className="w-2.5 h-2.5 rounded-full border-[2.5px] border-blue-500" />
        <span className="w-2.5 h-2.5 rounded-full border-[2.5px] border-sky-400" />
      </span>
      toonation
    </span>
  );
}

/** 상단 바: 투네이션 BI · 공지 · 알림 · 설정 · (설치형) 압정/창 버튼 (p9, p13) */
export function TitleBar() {
  const t = useT();
  const notice = useData((d) => d.notice);
  const [pinned, setPinned] = useState(false);
  const [maximized, setMaximized] = useState(false);

  return (
    <header className={`relative z-[10000] h-11 shrink-0 flex items-center gap-3 px-3 bg-white dark:bg-[#0f0f11] border-b border-slate-200 dark:border-white/10 ${desktop ? 'app-drag' : ''}`}>
      <button className="app-no-drag text-slate-900 dark:text-white" aria-label="투네이션 홈페이지 새 창" onClick={() => openUrl('https://toon.at')}>
        <Logo className="text-sm" />
      </button>
      <button
        onClick={() => notice.url && openUrl(notice.url)}
        className="app-no-drag flex-1 min-w-0 h-7 rounded-lg px-3 flex items-center gap-2 text-left text-xs font-semibold"
        style={{ background: notice.background, color: notice.color }}
      >
        <Volume2 size={14} className="shrink-0" />
        <span className="truncate">{notice.text}</span>
      </button>
      <div className="app-no-drag flex items-center gap-1">
        <AlarmButton />
        <Tooltip label={t('설정')} side="bottom">
          <button aria-label={t('설정')} onClick={() => uiStore.set({ settingsOpen: true })} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
            <Settings size={17} />
          </button>
        </Tooltip>
        {desktop && (
          <>
            <span className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1" />
            <Tooltip label="항상 맨 앞에" side="bottom">
              <button aria-label="압정" aria-pressed={pinned} onClick={() => { desktop!.window.setPinned(!pinned); setPinned(!pinned); }} className={`p-2 rounded-lg ${pinned ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/15' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                <Pin size={15} className={pinned ? 'fill-current' : ''} />
              </button>
            </Tooltip>
            <button aria-label="최소화" onClick={desktop.window.minimize} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><Minus size={15} /></button>
            <button aria-label="최대화" onClick={() => { desktop!.window.toggleMaximize(); setMaximized(!maximized); }} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
              {maximized ? <Copy size={13} /> : <Square size={13} />}
            </button>
            <button aria-label="닫기" onClick={desktop.window.close} className="p-2 rounded-lg text-slate-500 hover:bg-red-500 hover:text-white"><X size={15} /></button>
          </>
        )}
      </div>
    </header>
  );
}

/** 알림 (p13 ②): 안 읽은 알림 수, 클릭 시 고객센터 링크 새 창 + 읽음 처리, 모두 읽음 */
export function AlarmButton({ align = 'right' }: { align?: 'right' | 'left' }) {
  const t = useT();
  const alarms = useData((d) => d.alarms);
  const now = useNow(60_000);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useOutsideClick<HTMLDivElement>(close, open);
  const unread = alarms.filter((a) => !a.read).length;
  return (
    <div className="relative" ref={ref}>
      <Tooltip label={t('알림')} side="bottom">
        <button aria-label={t('알림')} onClick={() => setOpen((v) => !v)} className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
          <Bell size={17} />
          <Badge count={unread} className="absolute top-0 right-0" />
        </button>
      </Tooltip>
      {open && (
        <div className={`pop absolute ${align === 'right' ? 'right-0' : 'left-0'} top-11 w-80 max-w-[90vw] rounded-xl bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden`}>
          <div className="flex items-center justify-between px-4 h-10 border-b border-slate-100 dark:border-white/10">
            <span className="text-xs font-bold">{t('알림')}</span>
            <button onClick={api.readAllAlarms} className="text-[11px] font-bold text-blue-600 disabled:text-slate-400" disabled={unread === 0}>{t('모두 읽음')}</button>
          </div>
          <ul className="max-h-80 overflow-auto">
            {alarms.map((a) => (
              <li key={a.id}>
                <button onClick={() => { api.readAlarm(a.id); openUrl(a.url); }} className="w-full flex items-start gap-2 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${a.read ? 'bg-transparent' : 'bg-red-500'}`} />
                  <span className="flex-1 min-w-0">
                    <span className={`block text-xs ${a.read ? 'text-slate-500' : 'font-bold text-slate-800 dark:text-gray-100'}`}>{a.title}</span>
                    <span className="text-[10px] text-slate-400">{relativeTime(a.createdAt, now)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
