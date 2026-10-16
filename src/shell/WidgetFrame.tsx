import { GripHorizontal, Pin, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSettings } from '../lib/hooks';
import { useT } from '../lib/i18n';
import type { WidgetId } from '../types';
import { WIDGETS, isFixedWidget } from '../widgets/meta';
import { Tooltip } from '../components/ui';

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
      className={`h-full flex flex-col overflow-hidden rounded-xl border bg-white dark:bg-[#141416] text-slate-800 dark:text-gray-100 ${
        floating ? 'shadow-[0_20px_60px_rgba(15,23,42,0.35)] border-blue-400/60' : 'shadow-sm border-slate-200 dark:border-white/10'
      } ${dimmed ? 'opacity-50' : ''}`}
    >
      <header
        onPointerDown={onHeaderPointerDown}
        className={`h-9 shrink-0 flex items-center gap-2 pl-3 pr-1.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.03] select-none ${onHeaderPointerDown ? 'cursor-grab active:cursor-grabbing' : ''} ${headerClassName}`}
      >
        {onHeaderPointerDown && <GripHorizontal size={13} className="text-slate-400 shrink-0" />}
        <Icon size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
        <h2 className="text-xs font-black truncate">{t(meta.title)}</h2>
        <div className="ml-auto flex items-center gap-0.5 app-no-drag" onPointerDown={(e) => e.stopPropagation()}>
          {onTogglePin && !isFixedWidget(id) && (
            <Tooltip label={t('압정')} side="bottom">
              <button aria-label={t('압정')} aria-pressed={pinned} onClick={onTogglePin} className={`p-1.5 rounded-md ${pinned ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/15' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                <Pin size={13} className={pinned ? 'fill-current' : ''} />
              </button>
            </Tooltip>
          )}
          {onClose && !isFixedWidget(id) && (
            <Tooltip label={t('위젯 닫기')} side="bottom">
              <button aria-label={t('위젯 닫기')} onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                <X size={14} />
              </button>
            </Tooltip>
          )}
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-auto" style={scale !== 100 ? { zoom: scale / 100 } : undefined}>
        {children}
      </div>
    </section>
  );
}
