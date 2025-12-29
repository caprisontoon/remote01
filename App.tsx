
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Bell, List, Clock, CheckSquare, Vote, 
  Menu, Play, Volume2, Package, Layout,
  Sun, Moon, Megaphone, PinOff, Settings, X,
  Layers
} from 'lucide-react';
import { WindowId, WindowState, DockDirection, Preset } from './types';
import Window from './components/Window';
import DonationList from './components/widgets/DonationList';
import PendingDonations from './components/widgets/PendingDonations';
import DonationFeatures from './components/widgets/DonationFeatures';
import VotingWidget from './components/widgets/VotingWidget';
import NotificationSettings from './components/widgets/NotificationSettings';
import QuickMenu from './components/widgets/QuickMenu';
import CreatorMenu from './components/widgets/CreatorMenu';
import VolumeControl from './components/widgets/VolumeControl';
import DrawsWidget from './components/widgets/DrawsWidget';
import VideoControl from './components/widgets/VideoControl';
import PresetsWidget from './components/widgets/PresetsWidget';
import AnnouncementsWidget from './components/widgets/AnnouncementsWidget';

const GRID_COLS = 24; 
const GRID_ROWS = 24; 
const MARGIN = 8;
const MIN_W = 2; 
const MIN_H = 2;

const INITIAL_WINDOWS: WindowState[] = [
  { id: 'donations', title: '후원 리스트', gx: 0, gy: 0, gw: 16, gh: 16, x: 0, y: 0, width: 0, height: 0, isOpen: true, zIndex: 10, isMinimized: false, isFloating: false },
  { id: 'pending', title: '대기 중인 후원', gx: 16, gy: 0, gw: 8, gh: 24, x: 0, y: 0, width: 0, height: 0, isOpen: true, zIndex: 10, isMinimized: false, isFloating: false },
  { id: 'quick_menu', title: '퀵 메뉴', gx: 0, gy: 16, gw: 16, gh: 8, x: 0, y: 0, width: 0, height: 0, isOpen: true, zIndex: 10, isMinimized: false, isFloating: false },
  { id: 'features', title: '후원 사용', gx: 0, gy: 0, gw: 12, gh: 12, x: 0, y: 0, width: 0, height: 0, isOpen: false, zIndex: 10, isMinimized: false, isFloating: false },
  { id: 'vote', title: '투표', gx: 0, gy: 0, gw: 12, gh: 12, x: 0, y: 0, width: 0, height: 0, isOpen: false, zIndex: 10, isMinimized: false, isFloating: false },
  { id: 'notifications', title: '알림 설정', gx: 0, gy: 0, gw: 12, gh: 12, x: 0, y: 0, width: 0, height: 0, isOpen: false, zIndex: 10, isMinimized: false, isFloating: false },
  { id: 'creator_menu', title: '크리에이터 메뉴', gx: 0, gy: 0, gw: 12, gh: 12, x: 0, y: 0, width: 0, height: 0, isOpen: false, zIndex: 10, isMinimized: false, isFloating: false },
  { id: 'volume', title: '볼륨 제어', gx: 0, gy: 0, gw: 12, gh: 12, x: 0, y: 0, width: 0, height: 0, isOpen: false, zIndex: 10, isMinimized: false, isFloating: false },
  { id: 'announcements', title: '알림 (공지)', gx: 0, gy: 0, gw: 12, gh: 12, x: 0, y: 0, width: 0, height: 0, isOpen: false, zIndex: 10, isMinimized: false, isFloating: false },
  { id: 'draws', title: '뽑기 잔여 수량', gx: 0, gy: 0, gw: 12, gh: 12, x: 0, y: 0, width: 0, height: 0, isOpen: false, zIndex: 10, isMinimized: false, isFloating: false },
  { id: 'video_control', title: '영상 후원 제어', gx: 0, gy: 0, gw: 12, gh: 12, x: 0, y: 0, width: 0, height: 0, isOpen: false, zIndex: 10, isMinimized: false, isFloating: false },
];

const App: React.FC = () => {
  const [colWidth, setColWidth] = useState(0);
  const [rowHeight, setRowHeight] = useState(0);
  
  const syncWindowsToGrid = useCallback((wins: WindowState[], cw: number, rh: number) => {
    return wins.map(w => {
      if (w.isFloating) return w; 
      return {
        ...w,
        x: w.gx * cw + MARGIN,
        y: w.gy * rh + MARGIN,
        width: Math.max(0, w.gw * cw - 6),
        height: Math.max(0, w.gh * rh - 6)
      };
    });
  }, []);

  const [windows, setWindows] = useState<WindowState[]>(() => {
    const saved = localStorage.getItem('tiling-v59');
    if (saved) {
      const parsed = JSON.parse(saved) as WindowState[];
      return INITIAL_WINDOWS.map(init => {
        const p = parsed.find(item => item.id === init.id);
        return p ? { ...init, ...p } : init;
      });
    }
    return INITIAL_WINDOWS;
  });
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark');
  const [autoHideDock, setAutoHideDock] = useState(() => localStorage.getItem('auto-hide-dock') === 'true');
  const [isDockVisible, setIsDockVisible] = useState(true);
  const [focusedWindow, setFocusedWindow] = useState<WindowId | null>(null);
  const [draggingId, setDraggingId] = useState<WindowId | null>(null);
  const [hoveredWindowId, setHoveredWindowId] = useState<WindowId | null>(null);
  const [dockDirection, setDockDirection] = useState<DockDirection>(null);
  const [placingId, setPlacingId] = useState<WindowId | null>(null); 
  
  const [showPresets, setShowPresets] = useState(false);
  const [presets, setPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem('user-presets-v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const updateMetrics = useCallback(() => {
    const width = window.innerWidth - MARGIN * 2;
    const height = window.innerHeight - MARGIN * 2;
    setColWidth(width / GRID_COLS);
    setRowHeight(height / GRID_ROWS);
  }, []);

  useEffect(() => {
    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    return () => window.removeEventListener('resize', updateMetrics);
  }, [updateMetrics]);

  useEffect(() => {
    if (colWidth > 0 && rowHeight > 0) {
      setWindows(prev => syncWindowsToGrid(prev, colWidth, rowHeight));
    }
  }, [colWidth, rowHeight, syncWindowsToGrid]);

  useEffect(() => {
    localStorage.setItem('tiling-v59', JSON.stringify(windows));
    localStorage.setItem('user-presets-v2', JSON.stringify(presets));
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [windows, theme, presets]);

  const fillGap = useCallback((closedWin: WindowState, currentWins: WindowState[]) => {
    if (closedWin.isFloating) return currentWins; 

    const nextWins = currentWins.map(w => w.id === closedWin.id ? { ...w, isOpen: false } : { ...w });
    const openWins = nextWins.filter(w => w.isOpen && !w.isFloating);
    const t = closedWin; 

    const coversRange = (wins: WindowState[], start: number, end: number, propPos: 'gx' | 'gy', propSize: 'gw' | 'gh') => {
      if (wins.length === 0) return false;
      const sorted = [...wins].sort((a, b) => a[propPos] - b[propPos]);
      if (Math.abs(sorted[0][propPos] - start) > 0.1) return false;
      let currentEnd = sorted[0][propPos] + sorted[0][propSize];
      for (let i = 1; i < sorted.length; i++) {
        if (Math.abs(sorted[i][propPos] - currentEnd) > 0.1) return false; 
        currentEnd += sorted[i][propSize];
      }
      return Math.abs(currentEnd - end) < 0.1;
    };

    const rightNeighbors = openWins.filter(w => Math.abs(w.gx - (t.gx + t.gw)) < 0.1 && w.gy >= t.gy - 0.1 && (w.gy + w.gh) <= (t.gy + t.gh) + 0.1);
    if (coversRange(rightNeighbors, t.gy, t.gy + t.gh, 'gy', 'gh')) {
      rightNeighbors.forEach(w => { w.gx = t.gx; w.gw += t.gw; });
      return nextWins;
    }

    const leftNeighbors = openWins.filter(w => Math.abs((w.gx + w.gw) - t.gx) < 0.1 && w.gy >= t.gy - 0.1 && (w.gy + w.gh) <= (t.gy + t.gh) + 0.1);
    if (coversRange(leftNeighbors, t.gy, t.gy + t.gh, 'gy', 'gh')) {
      leftNeighbors.forEach(w => { w.gw += t.gw; });
      return nextWins;
    }

    const bottomNeighbors = openWins.filter(w => Math.abs(w.gy - (t.gy + t.gh)) < 0.1 && w.gx >= t.gx - 0.1 && (w.gx + w.gw) <= (t.gx + t.gw) + 0.1);
    if (coversRange(bottomNeighbors, t.gx, t.gx + t.gw, 'gx', 'gw')) {
      bottomNeighbors.forEach(w => { w.gy = t.gy; w.gh += t.gh; });
      return nextWins;
    }

    const topNeighbors = openWins.filter(w => Math.abs((w.gy + w.gh) - t.gy) < 0.1 && w.gx >= t.gx - 0.1 && (w.gx + w.gw) <= (t.gx + t.gw) + 0.1);
    if (coversRange(topNeighbors, t.gx, t.gx + t.gw, 'gx', 'gw')) {
      topNeighbors.forEach(w => { w.gh += t.gh; });
      return nextWins;
    }

    return nextWins;
  }, []);

  const getResizableEdges = useCallback((target: WindowState) => {
    if (target.isFloating) return { top: true, bottom: true, left: true, right: true };
    const others = windows.filter(w => w.id !== target.id && w.isOpen && !w.isFloating);
    const overlap = (aStart: number, aSize: number, bStart: number, bSize: number) => Math.max(aStart, bStart) < Math.min(aStart + aSize, bStart + bSize);

    return {
      top: others.some(w => Math.abs((w.gy + w.gh) - target.gy) < 0.1 && overlap(target.gx, target.gw, w.gx, w.gw)),
      bottom: others.some(w => Math.abs(w.gy - (target.gy + target.gh)) < 0.1 && overlap(target.gx, target.gw, w.gx, w.gw)),
      left: others.some(w => Math.abs((w.gx + w.gw) - target.gx) < 0.1 && overlap(target.gy, target.gh, w.gy, w.gh)),
      right: others.some(w => Math.abs(w.gx - (target.gx + target.gw)) < 0.1 && overlap(target.gy, target.gh, w.gy, w.gh)),
    };
  }, [windows]);

  const handleMove = useCallback((id: WindowId, x: number, y: number) => {
    setDraggingId(id);
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w));
  }, []);

  const handleDrop = useCallback((id: WindowId) => {
    if (hoveredWindowId && dockDirection) {
      setWindows(prev => {
        let next = prev.map(w => ({...w}));
        const source = next.find(w => w.id === id);

        if (dockDirection !== 'center' && source && !source.isFloating && source.isOpen) {
          next = fillGap(source, next);
        }

        const s = next.find(w => w.id === id)!;
        const t = next.find(w => w.id === hoveredWindowId)!;

        if (dockDirection === 'center') {
          if (!s.isFloating && !t.isFloating) {
            const temp = { gx: s.gx, gy: s.gy, gw: s.gw, gh: s.gh };
            s.gx = t.gx; s.gy = t.gy; s.gw = t.gw; s.gh = t.gh;
            t.gx = temp.gx; t.gy = temp.gy; t.gw = temp.gw; t.gh = temp.gh;
          } else if (s.isFloating && !t.isFloating) {
            s.gx = t.gx; s.gy = t.gy; s.gw = t.gw; s.gh = t.gh;
            t.isFloating = true;
            t.width = 480; t.height = 360;
            t.x = (window.innerWidth - 480) / 2;
            t.y = (window.innerHeight - 360) / 2;
            t.zIndex = Math.max(...next.map(n => n.zIndex)) + 1;
          }
        } else {
          if (dockDirection === 'left') { const splitW = Math.max(MIN_W, Math.floor(t.gw / 2)); const oldX = t.gx; t.gx += splitW; t.gw -= splitW; s.gx = oldX; s.gy = t.gy; s.gw = splitW; s.gh = t.gh; }
          else if (dockDirection === 'right') { const splitW = Math.max(MIN_W, Math.floor(t.gw / 2)); t.gw -= splitW; s.gx = t.gx + t.gw; s.gy = t.gy; s.gw = splitW; s.gh = t.gh; }
          else if (dockDirection === 'top') { const splitH = Math.max(MIN_H, Math.floor(t.gh / 2)); const oldY = t.gy; t.gy += splitH; t.gh -= splitH; s.gx = t.gx; s.gy = oldY; s.gw = t.gw; s.gh = splitH; }
          else if (dockDirection === 'bottom') { const splitH = Math.max(MIN_H, Math.floor(t.gh / 2)); t.gh -= splitH; s.gx = t.gx; s.gy = t.gy + t.gh; s.gw = t.gw; s.gh = splitH; }
        }
        
        s.isFloating = false; s.isOpen = true; s.isMinimized = false;
        return syncWindowsToGrid(next, colWidth, rowHeight);
      });
      if (id === placingId) setPlacingId(null); 
    } else {
      setWindows(prev => syncWindowsToGrid(prev, colWidth, rowHeight));
    }
    setHoveredWindowId(null); setDockDirection(null); setDraggingId(null);
  }, [hoveredWindowId, dockDirection, fillGap, colWidth, rowHeight, syncWindowsToGrid, placingId]);

  const handleResize = useCallback((id: WindowId, rect: { x: number, y: number, width: number, height: number }) => {
    setWindows(prev => {
      const win = prev.find(w => w.id === id);
      if (!win) return prev;
      if (win.isFloating) {
        return prev.map(w => w.id === id ? { ...w, ...rect } : w);
      }

      // Calculate Target Grid Coords
      const targetGw = Math.max(MIN_W, Math.round((rect.width + 6) / colWidth));
      const targetGh = Math.max(MIN_H, Math.round((rect.height + 6) / rowHeight));
      const targetGx = Math.max(0, Math.round((rect.x - MARGIN) / colWidth));
      const targetGy = Math.max(0, Math.round((rect.y - MARGIN) / rowHeight));

      const deltaW = targetGw - win.gw;
      const deltaX = targetGx - win.gx;
      const deltaH = targetGh - win.gh;
      const deltaY = targetGy - win.gy;

      if (deltaW === 0 && deltaX === 0 && deltaH === 0 && deltaY === 0) return prev;

      const candidates = prev.filter(w => w.isOpen && !w.isFloating);
      const overlap = (aStart: number, aSize: number, bStart: number, bSize: number) => Math.max(aStart, bStart) < Math.min(aStart + aSize, bStart + bSize);
      
      let seam = 0;
      let axis: 'x' | 'y' = 'x';
      let draggingFirstSide = false; // Is the dragged handle on the 'First' side of the seam? (Left/Top side)
      let calculatedShift = 0;

      // Determine Axis and Seam
      if (deltaX !== 0 || deltaW !== 0) {
        axis = 'x';
        if (deltaX !== 0) { // Dragging Left Handle
            seam = win.gx;
            draggingFirstSide = false; // Dragging the 'Second' side (Right side widget, left handle)
            calculatedShift = deltaX; // Moving left reduces X (negative shift), moving right increases X
        } else { // Dragging Right Handle
            seam = win.gx + win.gw;
            draggingFirstSide = true; // Dragging the 'First' side (Left side widget, right handle)
            calculatedShift = deltaW; // Moving right increases Width (positive shift)
        }
      } else {
        axis = 'y';
        if (deltaY !== 0) { // Dragging Top Handle
            seam = win.gy;
            draggingFirstSide = false;
            calculatedShift = deltaY;
        } else { // Dragging Bottom Handle
            seam = win.gy + win.gh;
            draggingFirstSide = true;
            calculatedShift = deltaH;
        }
      }

      // Find all widgets touching the seam
      const firstSideCandidates = candidates.filter(w => 
         axis === 'x' 
           ? Math.abs((w.gx + w.gw) - seam) < 0.1 
           : Math.abs((w.gy + w.gh) - seam) < 0.1
      );
      
      const secondSideCandidates = candidates.filter(w => 
         axis === 'x' 
           ? Math.abs(w.gx - seam) < 0.1 
           : Math.abs(w.gy - seam) < 0.1
      );

      // Iteratively find the connected group along the seam
      // Start with the dragged widget
      const connectedFirstSide = new Set<string>();
      const connectedSecondSide = new Set<string>();
      
      if (draggingFirstSide) connectedFirstSide.add(win.id);
      else connectedSecondSide.add(win.id);

      let changed = true;
      while(changed) {
        changed = false;
        
        // Find SecondSide widgets overlapping with any ConnectedFirstSide
        firstSideCandidates.forEach(f => {
            if (connectedFirstSide.has(f.id)) {
                secondSideCandidates.forEach(s => {
                    if (!connectedSecondSide.has(s.id)) {
                        const isOverlapping = axis === 'x' 
                            ? overlap(f.gy, f.gh, s.gy, s.gh)
                            : overlap(f.gx, f.gw, s.gx, s.gw);
                        if (isOverlapping) {
                            connectedSecondSide.add(s.id);
                            changed = true;
                        }
                    }
                });
            }
        });

        // Find FirstSide widgets overlapping with any ConnectedSecondSide
        secondSideCandidates.forEach(s => {
            if (connectedSecondSide.has(s.id)) {
                firstSideCandidates.forEach(f => {
                    if (!connectedFirstSide.has(f.id)) {
                        const isOverlapping = axis === 'x' 
                            ? overlap(f.gy, f.gh, s.gy, s.gh)
                            : overlap(f.gx, f.gw, s.gx, s.gw);
                        if (isOverlapping) {
                            connectedFirstSide.add(f.id);
                            changed = true;
                        }
                    }
                });
            }
        });
      }

      const firstGroup = candidates.filter(w => connectedFirstSide.has(w.id));
      const secondGroup = candidates.filter(w => connectedSecondSide.has(w.id));

      if (firstGroup.length === 0 || secondGroup.length === 0) return prev;

      // Calculate Limits
      // Max Positive Shift (Move Seam Right/Down): 
      // Limited by SecondGroup shrinking (size - MIN)
      let maxPositive = 1000;
      secondGroup.forEach(w => {
          const size = axis === 'x' ? w.gw : w.gh;
          maxPositive = Math.min(maxPositive, size - (axis === 'x' ? MIN_W : MIN_H));
      });

      // Max Negative Shift (Move Seam Left/Up):
      // Limited by FirstGroup shrinking (size - MIN)
      let maxNegative = 1000;
      firstGroup.forEach(w => {
          const size = axis === 'x' ? w.gw : w.gh;
          maxNegative = Math.min(maxNegative, size - (axis === 'x' ? MIN_W : MIN_H));
      });

      // Clamp Shift
      const finalShift = Math.max(-maxNegative, Math.min(maxPositive, calculatedShift));

      if (finalShift === 0) return prev;

      // Apply Shift
      const nextWins = prev.map(w => ({...w}));
      
      // Update First Group (Expand if +, Shrink if -)
      firstGroup.forEach(fw => {
          const target = nextWins.find(n => n.id === fw.id)!;
          if (axis === 'x') target.gw += finalShift;
          else target.gh += finalShift;
      });

      // Update Second Group (Shrink if +, Expand if -) AND Move Position
      secondGroup.forEach(sw => {
          const target = nextWins.find(n => n.id === sw.id)!;
          if (axis === 'x') {
              target.gx += finalShift;
              target.gw -= finalShift;
          } else {
              target.gy += finalShift;
              target.gh -= finalShift;
          }
      });

      return syncWindowsToGrid(nextWins, colWidth, rowHeight);
    });
  }, [colWidth, rowHeight, syncWindowsToGrid]);

  const toggleWindow = (id: WindowId) => {
    if (placingId && placingId !== id) return; 
    if (placingId === id) setPlacingId(null);

    setWindows(prev => {
      const target = prev.find(w => w.id === id);
      if (!target) return prev;
      
      if (target.isOpen) {
        if (target.isFloating) {
           return prev.map(w => w.id === id ? { ...w, isOpen: false, isFloating: false } : w);
        }
        const tiledWindows = prev.filter(w => w.isOpen && !w.isFloating);
        if (tiledWindows.length === 1 && tiledWindows[0].id === id) {
             return prev.map(w => w.id === id ? { ...w, isOpen: false } : w);
        }
        const next = fillGap(target, prev);
        return syncWindowsToGrid(next, colWidth, rowHeight);
      } else {
        const anyOpen = prev.some(w => w.isOpen && w.id !== id);
        if (!anyOpen) {
          const next = prev.map(w => w.id === id ? { 
            ...w, isOpen: true, isFloating: false, gx: 0, gy: 0, gw: GRID_COLS, gh: GRID_ROWS, zIndex: 10
          } : w);
          return syncWindowsToGrid(next, colWidth, rowHeight);
        } else {
          const winWidth = 480;
          const winHeight = 360;
          const centerX = (window.innerWidth - winWidth) / 2;
          const centerY = (window.innerHeight - winHeight) / 2;
          const maxZ = Math.max(0, ...prev.map(p => p.zIndex));
          setPlacingId(id); 
          return prev.map(w => w.id === id ? { 
            ...w, isOpen: true, isFloating: true, x: centerX, y: centerY, width: winWidth, height: winHeight, zIndex: maxZ + 1
          } : w);
        }
      }
    });
    setFocusedWindow(id);
  };

  const savePreset = (name: string, icon: string) => {
    const newPreset: Preset = { id: Date.now().toString(), name, icon, windows: JSON.parse(JSON.stringify(windows)) };
    setPresets([...presets, newPreset]); setActivePresetId(newPreset.id);
  };

  const loadPreset = (preset: Preset) => {
    setWindows(syncWindowsToGrid(preset.windows, colWidth, rowHeight));
    setActivePresetId(preset.id);
    setShowPresets(false);
    setPlacingId(null); 
  };

  const deletePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id));
    if (activePresetId === id) setActivePresetId(null);
  };

  const renamePreset = (id: string, newName: string) => {
    setPresets(presets.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  return (
    <div className={`fixed inset-0 overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-[#f2f4f7] text-slate-800'}`}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`, backgroundSize: `${colWidth}px ${rowHeight}px`, transform: `translate(${MARGIN}px, ${MARGIN}px)` }} />
      
      {placingId && (
        <div className="fixed inset-0 pointer-events-none z-[10002] flex items-start justify-center pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-2xl flex items-center gap-3 border border-white/20">
            <Layout size={18} className="animate-pulse" />
            <span className="text-sm font-black tracking-tight uppercase">중앙의 위젯을 드래그하여 원하는 위치에 배치해주세요</span>
          </div>
        </div>
      )}

      <div className="relative w-full h-full">
        {windows.map(win => win.isOpen && (
          <Window
            key={win.id}
            window={win}
            isFocused={focusedWindow === win.id}
            isDraggingId={draggingId}
            hoveredWindowId={hoveredWindowId}
            dockDirection={dockDirection}
            gridCols={GRID_COLS}
            gridRows={GRID_ROWS}
            isPlacingMode={!!placingId} 
            resizableEdges={getResizableEdges(win)} 
            onSetHoveredWindow={setHoveredWindowId}
            onSetDockDirection={setDockDirection}
            onBringToFront={() => setFocusedWindow(win.id)}
            onClose={() => toggleWindow(win.id)}
            onMove={handleMove}
            onDrop={() => handleDrop(win.id)}
            onResize={(rect) => handleResize(win.id, rect)}
            onResizeEnd={() => setWindows(prev => syncWindowsToGrid(prev, colWidth, rowHeight))}
          >
            {win.id === 'donations' ? <DonationList /> : win.id === 'pending' ? <PendingDonations /> : win.id === 'features' ? <DonationFeatures /> : win.id === 'vote' ? <VotingWidget /> : win.id === 'notifications' ? <NotificationSettings currentTheme={theme} onThemeChange={setTheme} autoHideDock={autoHideDock} onAutoHideToggle={setAutoHideDock} /> : win.id === 'quick_menu' ? <QuickMenu /> : win.id === 'creator_menu' ? <CreatorMenu /> : win.id === 'volume' ? <VolumeControl /> : win.id === 'draws' ? <DrawsWidget /> : win.id === 'video_control' ? <VideoControl /> : <AnnouncementsWidget />}
          </Window>
        ))}
      </div>

      <button 
        onClick={() => !placingId && setShowPresets(!showPresets)}
        style={{ right: showPresets ? '340px' : '0px' }}
        className={`fixed top-1/2 -translate-y-1/2 z-[10001] flex items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group outline-none ${placingId ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
      >
        <div className={`h-20 w-12 border border-r-0 shadow-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-500 rounded-l-2xl ${
          showPresets 
            ? 'bg-red-500 text-white border-red-400 w-14 shadow-red-500/20' 
            : 'bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10 text-slate-400 hover:bg-blue-600 hover:text-white hover:w-14'
        }`}>
          {showPresets ? <X size={24} /> : <Layers size={22} />}
          <span className={`text-[8px] font-black uppercase tracking-tighter transition-all duration-300 ${showPresets ? 'block' : 'hidden group-hover:block opacity-0 group-hover:opacity-100'}`}>
            {showPresets ? 'Close' : 'Presets'}
          </span>
        </div>
      </button>

      <div className={`fixed inset-0 z-[10000] pointer-events-none`}>
        <div 
          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-500 pointer-events-auto ${showPresets ? 'opacity-100' : 'opacity-0 !pointer-events-none'}`} 
          onClick={() => setShowPresets(false)} 
        />
        
        <div 
          className={`absolute right-0 top-0 bottom-0 w-full max-w-[340px] bg-white dark:bg-[#121212] border-l border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col pointer-events-auto transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            showPresets ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Layers size={20} className="text-blue-500" />
              <h2 className="text-sm font-black dark:text-white uppercase tracking-tighter">레이아웃 프리셋</h2>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 custom-scrollbar">
            <PresetsWidget 
              presets={presets} 
              activePresetId={activePresetId} 
              onSave={savePreset} 
              onUpdate={() => savePreset(presets.find(p => p.id === activePresetId)?.name || '업데이트', presets.find(p => p.id === activePresetId)?.icon || 'Monitor')} 
              onRename={renamePreset}
              onLoad={loadPreset}
              onDelete={deletePreset}
              onResetLayout={() => {
                setWindows(syncWindowsToGrid(INITIAL_WINDOWS.map(w => ({...w})), colWidth, rowHeight));
                setActivePresetId(null);
                setShowPresets(false);
              }}
            />
          </div>
        </div>
      </div>

      <div 
        className={`fixed bottom-0 left-0 right-0 h-28 flex items-center justify-center pointer-events-auto z-[9999] transition-all duration-500 ease-in-out ${
          placingId ? 'translate-y-[150%] opacity-0 pointer-events-none' : (
            autoHideDock && !isDockVisible ? 'translate-y-24 opacity-0 scale-95' : 'translate-y-[-16px] opacity-100 scale-100'
          )
        }`} 
        onMouseEnter={() => !placingId && setIsDockVisible(true)} 
        onMouseLeave={() => autoHideDock && !placingId && setIsDockVisible(false)}
      >
        <div className="flex items-center gap-2 p-2 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-3xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl">
          <button onClick={() => setAutoHideDock(!autoHideDock)} className={`w-11 h-11 flex items-center justify-center rounded-2xl border transition-all ${autoHideDock ? 'bg-amber-500 text-white border-amber-400' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}><PinOff size={20} /></button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
          <div className="w-px h-8 bg-slate-200 dark:bg-white/10 mx-1" />
          {INITIAL_WINDOWS.map(w => {
            const win = windows.find(x => x.id === w.id);
            const isOpen = win?.isOpen;
            const Icon = w.id === 'donations' ? List : w.id === 'pending' ? Clock : w.id === 'features' ? Package : w.id === 'vote' ? Vote : w.id === 'notifications' ? Bell : w.id === 'quick_menu' ? Layout : w.id === 'creator_menu' ? Menu : w.id === 'volume' ? Volume2 : w.id === 'draws' ? CheckSquare : w.id === 'video_control' ? Play : Megaphone;
            return (
              <button key={w.id} onClick={() => toggleWindow(w.id)} className={`w-11 h-11 flex items-center justify-center rounded-2xl border transition-all group relative ${isOpen ? 'bg-slate-900 dark:bg-indigo-500 text-white scale-110 shadow-lg' : 'bg-white dark:bg-white/5 text-slate-400 hover:text-indigo-500'}`} title={w.title}>
                <Icon size={20} />
                {isOpen && <div className="absolute -bottom-1.5 w-1 h-1 bg-blue-500 dark:bg-white rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default App;
