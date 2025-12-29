
import React, { useState, useEffect } from 'react';
import { Minus, X, GripHorizontal, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Square, Layout, ArrowDownToLine } from 'lucide-react';
import { WindowId, WindowState, DockDirection } from '../types';

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
  isFocused: boolean;
  isDraggingId: WindowId | null;
  hoveredWindowId: WindowId | null;
  dockDirection: DockDirection;
  gridCols: number;
  gridRows: number;
  isPlacingMode: boolean; // 배치 모드 활성화 여부
  onSetHoveredWindow: (id: WindowId | null) => void;
  onSetDockDirection: (dir: DockDirection) => void;
  onBringToFront: () => void;
  onClose: () => void;
  onMove: (id: WindowId, x: number, y: number) => void;
  onDrop: () => void;
  onResize: (rect: { x: number, y: number, width: number, height: number }) => void;
  onResizeEnd: () => void;
}

const Window: React.FC<WindowProps> = ({ 
  window: win, 
  children, 
  isFocused,
  isDraggingId,
  hoveredWindowId,
  dockDirection,
  gridCols,
  gridRows,
  isPlacingMode,
  onSetHoveredWindow,
  onSetDockDirection,
  onBringToFront, 
  onClose, 
  onMove,
  onDrop,
  onResize,
  onResizeEnd
}) => {
  const [isSelfDragging, setIsSelfDragging] = useState(false);
  const [resizeMode, setResizeMode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0, mx: 0, my: 0 });

  const handleDragStart = (e: React.MouseEvent) => {
    onBringToFront();
    setIsSelfDragging(true);
    setDragOffset({ x: e.clientX - win.x, y: e.clientY - win.y });
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    onBringToFront();
    setResizeMode(direction);
    setResizeStart({ x: win.x, y: win.y, w: win.width, h: win.height, mx: e.clientX, my: e.clientY });
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isSelfDragging) {
        onMove(win.id, e.clientX - dragOffset.x, e.clientY - dragOffset.y);
      } else if (resizeMode) {
        const dx = e.clientX - resizeStart.mx;
        const dy = e.clientY - resizeStart.my;
        let next = { x: resizeStart.x, y: resizeStart.y, width: resizeStart.w, height: resizeStart.h };
        if (resizeMode.includes('e')) next.width = Math.max(100, resizeStart.w + dx);
        if (resizeMode.includes('w')) { 
          const newW = Math.max(100, resizeStart.w - dx);
          next.x = resizeStart.x + (resizeStart.w - newW);
          next.width = newW;
        }
        if (resizeMode.includes('s')) next.height = Math.max(80, resizeStart.h + dy);
        if (resizeMode.includes('n')) { 
          const newH = Math.max(80, resizeStart.h - dy);
          next.y = resizeStart.y + (resizeStart.h - newH);
          next.height = newH;
        }
        onResize(next);
      }
    };

    const onMouseUp = () => {
      if (isSelfDragging) { onDrop(); setIsSelfDragging(false); }
      if (resizeMode) { onResizeEnd(); setResizeMode(null); }
    };

    if (isSelfDragging || resizeMode) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isSelfDragging, resizeMode, dragOffset, resizeStart, onMove, onDrop, onResize, onResizeEnd, win.id]);

  const isTargetWindow = hoveredWindowId === win.id;

  const ghostStyle = () => {
    if (!isTargetWindow || !dockDirection) return null;
    switch(dockDirection) {
      case 'left': return { left: 4, top: 4, width: 'calc(50% - 6px)', height: 'calc(100% - 8px)' };
      case 'right': return { left: 'calc(50% + 2px)', top: 4, width: 'calc(50% - 6px)', height: 'calc(100% - 8px)' };
      case 'top': return { left: 4, top: 4, width: 'calc(100% - 8px)', height: 'calc(50% - 6px)' };
      case 'bottom': return { left: 4, top: 'calc(50% + 2px)', width: 'calc(100% - 8px)', height: 'calc(50% - 6px)' };
      case 'center': return { left: '10%', top: '10%', width: '80%', height: '80%', backgroundColor: 'rgba(59, 130, 246, 0.4)' };
      default: return null;
    }
  };

  const ghost = ghostStyle();

  const canResizeN = win.gy > 0;
  const canResizeS = win.gy + win.gh < gridRows;
  const canResizeW = win.gx > 0;
  const canResizeE = win.gx + win.gw < gridCols;

  // 인디케이터 노출 조건:
  // 1. 일반 드래그: 내가 드래그 중이 아니고, 내 위에 마우스가 올라왔을 때
  // 2. 배치 모드(신규 위젯): 내가 타일 위젯이라면(isFloating=false), 무조건 노출
  const showCrossPicker = 
    (isDraggingId && isDraggingId !== win.id && isTargetWindow) || 
    (isPlacingMode && !win.isFloating);

  return (
    <div
      style={{ 
        left: win.x, 
        top: win.y, 
        width: win.width, 
        height: win.height, 
        zIndex: isSelfDragging ? 20000 : win.zIndex,
        transition: isSelfDragging || resizeMode ? 'none' : 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isSelfDragging ? 'none' : 'auto',
        opacity: isSelfDragging ? 0.7 : 1
      }}
      onMouseEnter={() => {
        // 드래그 중이거나 배치 모드일 때만 hover 이벤트 처리
        if ((isDraggingId && isDraggingId !== win.id) || (isPlacingMode && !win.isFloating)) {
          onSetHoveredWindow(win.id);
        }
      }}
      onMouseLeave={() => {
        if (hoveredWindowId === win.id) {
          onSetHoveredWindow(null);
          onSetDockDirection(null);
        }
      }}
      className={`absolute flex flex-col bg-white dark:bg-[#121212]/95 backdrop-blur-3xl border rounded-2xl overflow-hidden ${
        isFocused ? 'ring-2 ring-blue-500/50 shadow-2xl border-blue-500/30' : 'border-slate-200 dark:border-white/10 opacity-95 shadow-lg'
      } ${win.isFloating ? 'ring-4 ring-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.3)]' : ''}`}
    >
      {/* Ghost Preview Overlay */}
      {ghost && <div className="absolute transition-all duration-300 pointer-events-none z-40 rounded-xl bg-blue-500/20 border-2 border-blue-500/50" style={ghost} />}

      {/* Docking Indicator (Cross Picker) */}
      {showCrossPicker && (
        <div className="absolute inset-0 flex items-center justify-center z-[50] bg-black/10 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="relative w-40 h-40 flex items-center justify-center scale-95 hover:scale-100 transition-transform">
             <button 
                disabled={isPlacingMode}
                onMouseEnter={() => !isPlacingMode && onSetDockDirection('center')}
                onMouseLeave={() => !isPlacingMode && onSetDockDirection(null)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl border-2 z-20 ${
                  isPlacingMode 
                    ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-300 dark:text-white/20' 
                    : (dockDirection === 'center' && isTargetWindow 
                        ? 'bg-blue-600 text-white scale-110 border-blue-400 ring-4 ring-blue-500/30' 
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-300 dark:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600')
                }`}
              >
                <Square size={28} />
              </button>
              
              <button 
                onMouseEnter={() => onSetDockDirection('top')} 
                className={`absolute top-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 shadow-lg ${
                  dockDirection === 'top' && isTargetWindow 
                    ? 'bg-blue-600 text-white scale-110 border-blue-400 ring-4 ring-blue-500/30' 
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-300 dark:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
              >
                <ChevronUp size={24} />
              </button>
              
              <button 
                onMouseEnter={() => onSetDockDirection('bottom')} 
                className={`absolute bottom-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 shadow-lg ${
                  dockDirection === 'bottom' && isTargetWindow 
                    ? 'bg-blue-600 text-white scale-110 border-blue-400 ring-4 ring-blue-500/30' 
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-300 dark:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
              >
                <ChevronDown size={24} />
              </button>
              
              <button 
                onMouseEnter={() => onSetDockDirection('left')} 
                className={`absolute left-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 shadow-lg ${
                  dockDirection === 'left' && isTargetWindow 
                    ? 'bg-blue-600 text-white scale-110 border-blue-400 ring-4 ring-blue-500/30' 
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-300 dark:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
              >
                <ChevronLeft size={24} />
              </button>
              
              <button 
                onMouseEnter={() => onSetDockDirection('right')} 
                className={`absolute right-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 shadow-lg ${
                  dockDirection === 'right' && isTargetWindow 
                    ? 'bg-blue-600 text-white scale-110 border-blue-400 ring-4 ring-blue-500/30' 
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-300 dark:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
              >
                <ChevronRight size={24} />
              </button>
          </div>
        </div>
      )}

      {/* Resize Handles - 외부 경계면은 비활성화 */}
      {!isSelfDragging && !isDraggingId && !win.isFloating && (
        <>
          {canResizeN && <div className="absolute top-0 inset-x-0 h-1.5 cursor-ns-resize z-10" onMouseDown={e => handleResizeStart(e, 'n')} />}
          {canResizeS && <div className="absolute bottom-0 inset-x-0 h-1.5 cursor-ns-resize z-10" onMouseDown={e => handleResizeStart(e, 's')} />}
          {canResizeW && <div className="absolute left-0 inset-y-0 w-1.5 cursor-ew-resize z-10" onMouseDown={e => handleResizeStart(e, 'w')} />}
          {canResizeE && <div className="absolute right-0 inset-y-0 w-1.5 cursor-ew-resize z-10" onMouseDown={e => handleResizeStart(e, 'e')} />}
        </>
      )}

      <div 
        className={`h-11 flex items-center justify-between px-4 bg-slate-100/50 dark:bg-white/5 border-b select-none cursor-grab active:cursor-grabbing transition-colors ${isSelfDragging ? 'bg-blue-500/10' : ''}`}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-3">
          <GripHorizontal size={14} className={isFocused ? 'text-blue-500' : 'text-slate-400'} />
          <span className="text-[11px] font-black text-slate-700 dark:text-white uppercase tracking-tighter truncate">{win.title}</span>
          {win.isFloating && isPlacingMode && (
             <div className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded-full animate-pulse">위치 선정 필요</div>
          )}
        </div>
        <button 
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose} 
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white dark:bg-transparent p-4 custom-scrollbar select-text">
        {children}
      </div>
    </div>
  );
};

export default Window;
