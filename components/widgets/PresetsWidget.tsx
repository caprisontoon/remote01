
import React, { useState } from 'react';
import { Save, Trash2, Layout, Monitor, Gamepad2, MessageSquare, Star, RefreshCw, Check, Edit2, Plus, Clock, RotateCcw } from 'lucide-react';
import { Preset } from '../../types';

interface PresetsWidgetProps {
  presets: Preset[];
  activePresetId: string | null;
  onSave: (name: string, icon: string) => void;
  onUpdate: () => void;
  onRename: (id: string, newName: string) => void;
  onLoad: (preset: Preset) => void;
  onDelete: (id: string) => void;
  onResetLayout: () => void;
}

const ICON_OPTIONS = [
  { name: 'Monitor', icon: <Monitor size={16} /> },
  { name: 'Gamepad2', icon: <Gamepad2 size={16} /> },
  { name: 'MessageSquare', icon: <MessageSquare size={16} /> },
  { name: 'Star', icon: <Star size={16} /> },
];

const PresetsWidget: React.FC<PresetsWidgetProps> = ({
  presets,
  activePresetId,
  onSave,
  onUpdate,
  onRename,
  onLoad,
  onDelete,
  onResetLayout
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Monitor');

  const getIcon = (iconName: string) => {
    const option = ICON_OPTIONS.find(o => o.name === iconName);
    return option ? option.icon : <Monitor size={16} />;
  };

  const handleSaveNew = () => {
    if (newPresetName.trim()) {
      onSave(newPresetName.trim(), selectedIcon);
      setNewPresetName('');
      setShowAddForm(false);
    }
  };

  const handleUpdate = () => {
    setIsUpdating(true);
    onUpdate();
    setTimeout(() => setIsUpdating(false), 1000);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1a1a1a] -m-3 p-4 select-none">
      {/* Current Active Info */}
      <div className="mb-6">
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center justify-between">
          <span>현재 상태</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={onResetLayout}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
              title="레이아웃 초기화"
            >
              <RotateCcw size={12} />
              <span className="text-[10px] font-bold">초기화</span>
            </button>
            {activePresetId && <span className="text-blue-500 flex items-center gap-1"><Clock size={10}/> 사용 중</span>}
          </div>
        </h3>
        
        {activePresetId ? (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                {getIcon(presets.find(p => p.id === activePresetId)?.icon || 'Monitor')}
              </div>
              <div>
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {presets.find(p => p.id === activePresetId)?.name}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-gray-500">배치 변경됨</div>
              </div>
            </div>
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={`p-2 rounded-lg transition-all ${isUpdating ? 'bg-green-500 text-white' : 'bg-white dark:bg-[#2a2a2a] text-slate-600 dark:text-gray-300 hover:bg-slate-50 border border-slate-200 dark:border-white/10 shadow-sm'}`}
            >
              {isUpdating ? <Check size={16} /> : <RefreshCw size={16} className={isUpdating ? 'animate-spin' : ''} />}
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 text-center">
            <p className="text-[11px] text-slate-400 dark:text-gray-500 font-medium">프리셋이 적용되지 않았습니다.</p>
          </div>
        )}
      </div>

      {/* Preset List */}
      <div className="flex-1 overflow-auto space-y-2 pr-1 custom-scrollbar">
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">저장된 레이아웃</h3>
        
        {presets.map((preset) => (
          <div
            key={preset.id}
            onClick={() => onLoad(preset)}
            className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              activePresetId === preset.id
                ? 'bg-white dark:bg-[#222] border-blue-500 shadow-md ring-1 ring-blue-500/20'
                : 'bg-white dark:bg-[#222] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${activePresetId === preset.id ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-[#333] text-slate-500 dark:text-gray-400'}`}>
                {getIcon(preset.icon)}
              </div>
              <div className="overflow-hidden">
                <h4 className={`text-[12px] font-bold truncate ${activePresetId === preset.id ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300'}`}>
                  {preset.name}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                   <span className="text-[9px] text-slate-400 dark:text-gray-500">위젯 {preset.windows.filter(w => w.isOpen).length}개</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); const n = prompt('이름 수정:', preset.name); if(n) onRename(preset.id, n); }}
                className="p-1.5 text-slate-400 hover:text-blue-500 transition-all"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(preset.id); }}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {presets.length === 0 && (
          <div className="py-8 text-center text-[11px] text-slate-400 dark:text-gray-600 italic">저장된 프리셋이 없습니다.</div>
        )}
      </div>

      {/* Add Form / Button */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
        {showAddForm ? (
          <div className="space-y-3 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10">
            <input
              autoFocus
              type="text"
              placeholder="프리셋 이름"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNew()}
              className="w-full bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {ICON_OPTIONS.map(opt => (
                  <button
                    key={opt.name}
                    onClick={() => setSelectedIcon(opt.name)}
                    className={`p-2 rounded-lg border transition-all ${selectedIcon === opt.name ? 'bg-blue-600 border-blue-400 text-white shadow-md' : 'bg-white dark:bg-[#2a2a2a] border-slate-200 dark:border-white/5 text-slate-400'}`}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-700"
                >
                  취소
                </button>
                <button 
                  onClick={handleSaveNew}
                  className="px-4 py-2 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-3.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-xl shadow-slate-900/10 dark:shadow-blue-500/10 active:scale-[0.98]"
          >
            <Plus size={16} />
            현재 레이아웃 저장하기
          </button>
        )}
      </div>
    </div>
  );
};

export default PresetsWidget;
