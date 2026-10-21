import { Bell, Copy, Minus, Pin, Settings, Square, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { api } from '../state/app';
import { uiStore } from '../state/ui';
import { relativeTime } from '../lib/donation';
import { useData, useNow, useOutsideClick } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { desktop, openUrl } from '../platform';
import { Badge, Tooltip } from '../components/ui';
import { Logo } from '../components/Brand';

export const TITLEBAR_HEIGHT = 44;

/** 상단 바 아이콘 버튼: 36×36 사각(radius-control) + 1px line */
const barButton = 'w-9 h-9 rounded-control border border-line flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-raised transition-colors';

/** 창 버튼: 테두리 없이 hover 때만 바탕 */
const captionButton = 'w-[42px] h-9 rounded-control flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-raised transition-colors';

/** 상단 바: 투네이션 BI · 공지 · 알림 · 설정 · (설치형) 압정/창 버튼 (p9, p13) */
export function TitleBar() {
  const t = useT();
  const notice = useData((d) => d.notice);
  const [pinned, setPinned] = useState(false);
  const [maximized, setMaximized] = useState(false);

  return (
    // 설치형: 상단 바 전체가 창 끌기 영역(app-drag)이고 버튼만 제외(app-no-drag). 위쪽 8px 여백까지 끌기 영역에 넣는다
    <header className={`relative z-titlebar shrink-0 flex items-center gap-2.5 px-1.5 ${desktop ? 'app-drag -mt-2 pt-2 h-[52px]' : 'h-[44px]'}`}>
      <button className="app-no-drag shrink-0" aria-label="투네이션 홈페이지 새 창" onClick={() => openUrl('https://toon.at')}>
        <Logo height={20} />
      </button>
      <button
        onClick={() => notice.url && openUrl(notice.url)}
        className={`app-no-drag min-w-0 h-8 rounded-dock-item px-3 flex items-center gap-2.5 text-left bg-brand-tint border border-brand-tint-line text-text font-medium ${desktop ? 'flex-[0_1_560px]' : 'flex-1'}`}
      >
        <span className="shrink-0 px-1.5 py-0.5 rounded-tag bg-brand text-text-on-brand text-micro font-bold">{t('공지')}</span>
        <span className="truncate">{notice.text}</span>
      </button>
      {/* 창 끌기 손잡이: 공지 바가 폭을 다 차지하지 않게 하고, 그 사이에 항상 남는 빈 영역(최소 96px)에 점무늬를 그려 잡는 곳임을 보인다 */}
      {desktop && (
        <div aria-hidden title="끌어서 창 이동 · 두 번 클릭하면 최대화" className="flex-1 min-w-[96px] self-stretch flex items-center justify-center">
          <span className="drag-grip w-14 h-2.5" />
        </div>
      )}
      <LiveBadge />
      <div className="app-no-drag flex items-center gap-1.5">
        <AlarmButton />
        <Tooltip label={t('설정')} side="bottom">
          <button aria-label={t('설정')} onClick={() => uiStore.set({ settingsOpen: true })} className={barButton}>
            <Settings size={17} />
          </button>
        </Tooltip>
        {desktop && (
          <>
            <span className="w-px h-5 bg-line mx-0.5" />
            <Tooltip label="항상 맨 앞에" side="bottom">
              <button aria-label="압정" aria-pressed={pinned} onClick={() => { desktop!.window.setPinned(!pinned); setPinned(!pinned); }} className={pinned ? `${barButton} !bg-brand-tint !text-link` : barButton}>
                <Pin size={15} className={pinned ? 'fill-current' : ''} />
              </button>
            </Tooltip>
            {/* 창 버튼(최소화·최대화·닫기)은 테두리 없는 Windows 기본 형태 */}
            <div className="flex items-center ml-1">
              <button aria-label="최소화" onClick={desktop.window.minimize} className={captionButton}><Minus size={16} /></button>
              <button aria-label="최대화" onClick={() => { desktop!.window.toggleMaximize(); setMaximized(!maximized); }} className={captionButton}>
                {maximized ? <Copy size={13} /> : <Square size={13} />}
              </button>
              <button aria-label="닫기" onClick={desktop.window.close} className={`${captionButton} hover:!bg-danger hover:!text-white`}><X size={16} /></button>
            </div>
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
  const bell = (
    <button aria-label={t('알림')} aria-expanded={open} onClick={() => setOpen((v) => !v)} className={`relative ${barButton}`}>
      <Bell size={17} />
      <Badge count={unread} className="absolute -top-1.5 -right-1.5" />
    </button>
  );
  return (
    <div className="relative" ref={ref}>
      {/* 목록이 열려 있으면 툴팁을 띄우지 않는다 — [모두 읽음]을 가리지 않게 */}
      {open ? bell : <Tooltip label={t('알림')} side="bottom">{bell}</Tooltip>}
      {open && (
        <div className={`pop absolute ${align === 'right' ? 'right-0' : 'left-0'} top-11 w-80 max-w-[90vw] rounded-card bg-surface border border-line shadow-float overflow-hidden text-text`}>
          <div className="flex items-center justify-between px-4 h-11 border-b border-line">
            <span className="text-title-widget">{t('알림')}</span>
            <button onClick={api.readAllAlarms} className="text-body font-semibold text-link disabled:text-text-tertiary" disabled={unread === 0}>{t('모두 읽음')}</button>
          </div>
          <ul className="max-h-80 overflow-auto">
            {alarms.map((a) => (
              <li key={a.id} className="border-b border-line-subtle last:border-b-0">
                <button
                  onClick={() => { api.readAlarm(a.id); openUrl(a.url); }}
                  className={`w-full flex flex-col gap-0.5 px-4 py-2.5 text-left ${a.read ? 'bg-surface hover:bg-surface-sunken' : 'bg-brand-tint hover:brightness-110'}`}
                >
                  <span className={`text-body ${a.read ? 'text-text-secondary' : 'font-bold text-text'}`}>{a.title}</span>
                  <span className="text-caption text-text-tertiary">{relativeTime(a.createdAt, now)}</span>
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
    <button onClick={() => uiStore.set({ settingsOpen: true })} title="설정 > 투네이션 연동" className="app-no-drag h-8 px-2.5 rounded-control border border-line flex items-center gap-1.5 text-caption font-semibold text-text">
      <span className={`w-2 h-2 rounded-pill ${on ? 'bg-live blink' : live.state === 'error' ? 'bg-danger' : 'bg-warning'}`} />
      {on ? '실시간' : live.state === 'error' ? '연결 오류' : '연결 중'}
    </button>
  );
}
