
import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle, Zap, Trophy, Timer, GripVertical } from 'lucide-react';

interface Task {
  id: string;
  type: 'Quest' | 'LuckyBox' | 'MiniGame';
  title: string;
  nick: string;
  reward: string;
  timeLeft: number; 
  totalTime: number; 
  priority: 'low' | 'medium' | 'high';
}

const MOCK_TASKS: Task[] = [
  { id: 't1', type: 'Quest', title: '5연킬 달성하기', nick: '열혈팬01', reward: '50,000', timeLeft: 45, totalTime: 300, priority: 'high' },
  { id: 't2', type: 'LuckyBox', title: '황금 상자 개봉', nick: '나그네', reward: '10,000', timeLeft: 120, totalTime: 600, priority: 'medium' },
  { id: 't3', type: 'Quest', title: '웃음 참기 미션', nick: '도전자A', reward: '5,000', timeLeft: 15, totalTime: 60, priority: 'high' },
  { id: 't4', type: 'MiniGame', title: '굴려굴려 주사위', nick: '게임봇', reward: '1,000', timeLeft: 400, totalTime: 1200, priority: 'low' },
];

const PendingDonations: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTasks(prev => prev.map(t => ({
        ...t,
        timeLeft: Math.max(0, t.timeLeft - 1)
      })));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-400';
      case 'medium': return 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/40 text-orange-600 dark:text-orange-400';
      default: return 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/40 text-blue-600 dark:text-blue-400';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Quest': return <span className="flex items-center gap-1 bg-purple-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold"><Trophy size={10} /> 퀘스트</span>;
      case 'LuckyBox': return <span className="flex items-center gap-1 bg-yellow-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold"><Zap size={10} /> 럭키박스</span>;
      default: return <span className="flex items-center gap-1 bg-blue-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold"><AlertCircle size={10} /> 미니게임</span>;
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newTasks = [...tasks];
      const draggedItem = newTasks[draggedIndex];
      newTasks.splice(draggedIndex, 1);
      newTasks.splice(dragOverIndex, 0, draggedItem);
      setTasks(newTasks);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700 dark:text-gray-200">진행 중인 미션</span>
          <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
            {tasks.filter(t => t.timeLeft > 0).length}
          </span>
        </div>
        <button className="text-[10px] text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors underline decoration-dotted">전체보기</button>
      </div>

      <div className="flex-1 overflow-auto space-y-3 pr-1 pb-4">
        {tasks.map((task, index) => {
          const progress = (task.timeLeft / task.totalTime) * 100;
          const isUrgent = task.timeLeft < 30 && task.timeLeft > 0;
          const isDragging = draggedIndex === index;
          const isTarget = dragOverIndex === index && !isDragging;
          
          return (
            <div 
              key={task.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              className={`relative bg-white dark:bg-[#2a2a2a] border rounded-lg p-3 transition-all duration-200 overflow-hidden cursor-default group
                ${getPriorityClasses(task.priority)} 
                ${isUrgent ? 'ring-1 ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : ''}
                ${isDragging ? 'opacity-30 scale-95 border-dashed grayscale pointer-events-none' : 'opacity-100 scale-100'}
                ${isTarget ? 'border-t-4 border-t-blue-500 mt-2 shadow-lg brightness-110' : ''}
              `}
            >
              {/* Drag Handle */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                <GripVertical size={16} className="text-slate-400 dark:text-gray-500" />
              </div>

              <div className="flex items-center justify-between mb-2">
                {getTypeBadge(task.type)}
                <span className="text-[10px] font-bold text-slate-400 dark:text-gray-400 truncate max-w-[80px] mr-5">{task.nick}</span>
              </div>

              <div className="mb-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-gray-100 mb-1">{task.title}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold tracking-tight">
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 mr-1 uppercase">Reward</span>
                    {task.reward}
                  </span>
                  <div className={`flex items-center gap-1 text-[11px] font-mono font-bold ${isUrgent ? 'text-red-500 animate-pulse' : 'text-slate-500 dark:text-gray-400'}`}>
                    <Timer size={12} />
                    {formatTime(task.timeLeft)}
                  </div>
                </div>
              </div>

              <div className="w-full h-1 bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear ${progress < 20 ? 'bg-red-500' : progress < 50 ? 'bg-orange-500' : 'bg-blue-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className="bg-blue-600 text-white dark:bg-blue-600/20 dark:hover:bg-blue-600/40 dark:text-blue-400 border border-blue-600 dark:border-blue-500/30 py-1.5 rounded-md text-[10px] font-bold transition-all transform active:scale-95 shadow-sm">수락</button>
                <button className="bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-white/5 py-1.5 rounded-md text-[10px] font-bold transition-all">거절</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PendingDonations;
