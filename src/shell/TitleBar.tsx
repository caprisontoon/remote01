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
    <header className={`relative z-[10000] h-14 shrink-0 flex items-center gap-3 px-4 ${desktop ? 'app-drag' : ''}`}>
      <button className="app-no-drag text-black dark:text-white" aria-label="투네이션 홈페이지 새 창" onClick={() => openUrl('https://toon.at')}>
        <Logo className="text-sm" />
      </button>
      <button
        onClick={() => notice.url && openUrl(notice.url)}
        className="app-no-drag flex-1 min-w-0 h-9 rounded-full px-4 flex items-center gap-2 text-left text-[13px] font-medium glass"
        style={{ background: notice.background, color: notice.color }}
      >
        <Volume2 size={14} className="shrink-0" />
        <span className="truncate">{notice.text}</span>
      </button>
      <LiveBadge />
      <div className="app-no-drag flex items-center gap-1 h-11 px-1 rounded-full glass">
        <AlarmButton />
        <Tooltip label={t('설정')} side="bottom">
          <button aria-label={t('설정')} onClick={() => uiStore.set({ settingsOpen: true })} className="w-9 h-9 rounded-full flex items-center justify-center text-black/80 dark:text-white/85 hover:bg-black/5 dark:hover:bg-white/10">
            <Settings size={18} />
          </button>
        </Tooltip>
        {desktop && (
          <>
            <span className="w-px h-5 bg-black/10 dark:bg-white/15 mx-0.5" />
            <Tooltip label="항상 맨 앞에" side="bottom">
              <button aria-label="압정" aria-pressed={pinned} onClick={() => { desktop!.window.setPinned(!pinned); setPinned(!pinned); }} className={`w-9 h-9 rounded-full flex items-center justify-center ${pinned ? 'text-white bg-blue-600' : 'text-black/80 dark:text-white/85 hover:bg-black/5 dark:hover:bg-white/10'}`}>
                <Pin size={15} className={pinned ? 'fill-current' : ''} />
              </button>
            </Tooltip>
            <button aria-label="최소화" onClick={desktop.window.minimize} className="w-9 h-9 rounded-full flex items-center justify-center text-black/80 dark:text-white/85 hover:bg-black/5 dark:hover:bg-white/10"><Minus size={15} /></button>
            <button aria-label="최대화" onClick={() => { desktop!.window.toggleMaximize(); setMaximized(!maximized); }} className="w-9 h-9 rounded-full flex items-center justify-center text-black/80 dark:text-white/85 hover:bg-black/5 dark:hover:bg-white/10">
              {maximized ? <Copy size={13} /> : <Square size={13} />}
            </button>
            <button aria-label="닫기" onClick={desktop.window.close} className="w-9 h-9 rounded-full flex items-center justify-center text-black/80 dark:text-white/85 hover:bg-red-500 hover:text-white"><X size={15} /></button>
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
        <button aria-label={t('알림')} onClick={() => setOpen((v) => !v)} className="relative w-9 h-9 rounded-full flex items-center justify-center text-black/80 dark:text-white/85 hover:bg-black/5 dark:hover:bg-white/10">
          <Bell size={18} />
          <Badge count={unread} className="absolute -top-1 -right-1" />
        </button>
      </Tooltip>
      {open && (
        <div className={`pop absolute ${align === 'right' ? 'right-0' : 'left-0'} top-12 w-80 max-w-[90vw] rounded-[26px] glass-strong overflow-hidden text-black dark:text-white`}>
          <div className="flex items-center justify-between px-5 h-12">
            <span className="text-[15px] font-semibold">{t('알림')}</span>
            <button onClick={api.readAllAlarms} className="text-[13px] font-medium text-blue-600 disabled:text-black/30 dark:disabled:text-white/30" disabled={unread === 0}>{t('모두 읽음')}</button>
          </div>
          <ul className="max-h-80 overflow-auto">
            {alarms.map((a) => (
              <li key={a.id}>
                <button onClick={() => { api.readAlarm(a.id); openUrl(a.url); }} className="w-full flex items-start gap-2 px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${a.read ? 'bg-transparent' : 'bg-red-500'}`} />
                  <span className="flex-1 min-w-0">
                    <span className={`block text-xs ${a.read ? 'text-slate-500' : 'font-bold text-black dark:text-white'}`}>{a.title}</span>
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

/** 투네이션 실시간 후원 수신 상태 (연결됐을 때만 표시) */
function LiveBadge() {
  const live = useData((d) => d.live);
  if (live.state === 'off') return null;
  const on = live.state === 'connected';
  return (
    <button onClick={() => uiStore.set({ settingsOpen: true })} title="설정 > 투네이션 연동" className={`app-no-drag h-9 px-3 rounded-full flex items-center gap-1.5 text-[12px] font-semibold ${on ? 'bg-red-500 text-white' : 'glass text-black/70 dark:text-white/70'}`}>
      <span className={`w-2 h-2 rounded-full ${on ? 'bg-white blink' : live.state === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} />
      {on ? '실시간' : live.state === 'error' ? '연결 오류' : '연결 중'}
    </button>
  );
}
