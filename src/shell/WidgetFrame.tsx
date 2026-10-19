import { Pin, X } from 'lucide-react';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../lib/i18n';
import type { WidgetId } from '../types';
import { WIDGETS, isFixedWidget } from '../widgets/meta';
import { IconButton, Tooltip } from '../components/ui';
import { WidgetErrorBoundary } from '../components/ErrorBoundary';

/** 위젯 제목줄 안에 위젯이 자기 조작(탭·필터 등)을 놓을 자리. null = 위젯 틀 밖(모바일 전체 화면 등), 'pending' = 틀이 자리를 만드는 중 */
const HeaderSlot = createContext<HTMLElement | 'pending' | null>(null);

/**
 * 위젯 본문에서 제목줄로 내용을 올려 보낸다 (예: 후원 리스트의 탭·필터·정렬).
 * 위젯 틀 밖에서 쓰이면(모바일) 본문 맨 위에 같은 모양의 줄로 그린다.
 */
export function WidgetHeader({ children }: { children: ReactNode }) {
  const slot = useContext(HeaderSlot);
  if (slot === 'pending') return null;
  if (slot) return createPortal(children, slot);
  return <div className="h-[44px] shrink-0 flex items-stretch gap-2 px-2 border-b border-line">{children}</div>;
}

/**
 * 위젯 공통 틀 (토큰 문서 §5): surface 바탕, 1px line 테두리, radius-widget.
 * 제목줄 44px + 아래 1px line, 제목 왼쪽, 조작 버튼(압정·닫기)은 오른쪽 text-tertiary 아이콘.
 * 압정은 분리된 창에서만, 닫기는 후원 리스트를 제외한 위젯에만 있다 (p28, p38).
 */
export function WidgetFrame({
  id,
  children,
  onHeaderPointerDown,
  onClose,
  pinned,
  onTogglePin,
  floating,
  dimmed,
  headerClassName = '',
}: {
  id: WidgetId;
  children: ReactNode;
  onHeaderPointerDown?: (e: React.PointerEvent) => void;
  onClose?: () => void;
  pinned?: boolean;
  onTogglePin?: () => void;
  floating?: boolean;
  dimmed?: boolean;
  headerClassName?: string;
}) {
  const t = useT();
  const meta = WIDGETS[id];
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return (
    <section
      aria-label={t(meta.title)}
      className={`h-full flex flex-col overflow-hidden rounded-widget bg-surface border text-text ${
        floating ? 'border-live shadow-float' : 'border-line'
      } ${dimmed ? 'opacity-40' : ''}`}
    >
      <header
        onPointerDown={onHeaderPointerDown}
        className={`h-[44px] shrink-0 flex items-stretch gap-3 pl-[14px] pr-2 border-b border-line select-none ${onHeaderPointerDown ? 'cursor-grab active:cursor-grabbing' : ''} ${headerClassName}`}
      >
        {/* 제목이 먼저 자리를 갖고(한 줄 말줄임), 제목줄 조작은 남는 폭 안에서 줄어든다 */}
        <h2 className="self-center shrink-0 max-w-[60%] text-title-widget truncate">{t(meta.title)}</h2>
        <div ref={setSlot} className="flex-1 min-w-0 overflow-hidden flex items-stretch gap-2 app-no-drag" onPointerDown={(e) => e.stopPropagation()} />
        <div className="self-center flex items-center gap-0.5 app-no-drag" onPointerDown={(e) => e.stopPropagation()}>
          {onTogglePin && !isFixedWidget(id) && (
            <Tooltip label={t('압정')} side="bottom">
              <IconButton label={t('압정')} aria-pressed={pinned} active={pinned} onClick={onTogglePin}>
                <Pin size={14} className={pinned ? 'fill-current' : ''} />
              </IconButton>
            </Tooltip>
          )}
          {onClose && !isFixedWidget(id) && (
            <Tooltip label={t('위젯 닫기')} side="bottom">
              <IconButton label={t('위젯 닫기')} onClick={onClose}>
                <X size={15} />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-auto">
        <HeaderSlot.Provider value={slot ?? 'pending'}>
          <WidgetErrorBoundary name={id}>{children}</WidgetErrorBoundary>
        </HeaderSlot.Provider>
      </div>
    </section>
  );
}
