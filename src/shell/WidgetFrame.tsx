import { GripHorizontal, Pin, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSettings } from '../lib/hooks';
import { useT } from '../lib/i18n';
import type { WidgetId } from '../types';
import { WIDGETS, isFixedWidget } from '../widgets/meta';
import { Tooltip } from '../components/ui';
import { WidgetErrorBoundary } from '../components/ErrorBoundary';

/**
 * 위젯 공통 틀: 헤더(드래그 손잡이 + 제목 + 버튼) + 본문.
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
  const scale = useSettings((s) => s.textScale);
  const meta = WIDGETS[id];
  const Icon = meta.icon;
  return (
    <section
      aria-label={t(meta.title)}
      className={`h-full flex flex-col overflow-hidden rounded-card bg-white dark:bg-[#1c1c1e] text-black dark:text-white ${
        floating ? 'shadow-sheet ring-2 ring-blue-600/50' : 'shadow-card'
      } ${dimmed ? 'opacity-40' : ''}`}
    >
      <header
        onPointerDown={onHeaderPointerDown}
        className={`h-10 shrink-0 flex items-center gap-2 pl-4 pr-2 select-none ${onHeaderPointerDown ? 'cursor-grab active:cursor-grabbing' : ''} ${headerClassName}`}
      >
        {onHeaderPointerDown && <GripHorizontal size={13} className="text-black/25 dark:text-white/30 shrink-0" />}
        <Icon size={15} className="text-blue-600 shrink-0" />
        <h2 className="text-[13px] font-semibold truncate">{t(meta.title)}</h2>
        <div className="ml-auto flex items-center gap-1 app-no-drag" onPointerDown={(e) => e.stopPropagation()}>
          {onTogglePin && !isFixedWidget(id) && (
            <Tooltip label={t('압정')} side="bottom">
              <button aria-label={t('압정')} aria-pressed={pinned} onClick={onTogglePin} className={`w-7 h-7 rounded-full flex items-center justify-center ${pinned ? 'text-white bg-blue-600' : 'text-black/60 dark:text-white/70 bg-[rgba(120,120,128,0.12)] hover:bg-[rgba(120,120,128,0.2)]'}`}>
                <Pin size={13} className={pinned ? 'fill-current' : ''} />
              </button>
            </Tooltip>
          )}
          {onClose && !isFixedWidget(id) && (
            <Tooltip label={t('위젯 닫기')} side="bottom">
              <button aria-label={t('위젯 닫기')} onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-black/60 dark:text-white/70 bg-[rgba(120,120,128,0.12)] hover:bg-[rgba(120,120,128,0.2)]">
                <X size={14} />
              </button>
            </Tooltip>
          )}
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-auto" style={scale !== 100 ? { zoom: scale / 100 } : undefined}>
        <WidgetErrorBoundary name={id}>{children}</WidgetErrorBoundary>
      </div>
    </section>
  );
}
