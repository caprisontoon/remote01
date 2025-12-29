
export type WindowId = 
  | 'donations' 
  | 'pending' 
  | 'features' 
  | 'vote' 
  | 'notifications' 
  | 'quick_menu' 
  | 'creator_menu' 
  | 'volume' 
  | 'draws' 
  | 'video_control'
  | 'presets'
  | 'announcements';

export type DockDirection = 'top' | 'bottom' | 'left' | 'right' | 'center' | null;

export interface WindowState {
  id: WindowId;
  title: string;
  gx: number;
  gy: number;
  gw: number;
  gh: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isOpen: boolean;
  zIndex: number;
  isMinimized: boolean;
  isFloating?: boolean; // 그리드에 묶이지 않은 상태인지 여부
  tabs?: WindowId[]; 
}

export interface Preset {
  id: string;
  name: string;
  icon: string;
  windows: WindowState[];
}

export interface Donation {
  id: string;
  type: 'Text' | 'Video' | 'Mini' | 'Roulette' | 'Quest' | 'Image' | 'Gift' | 'LuckyBox';
  nick: string;
  amount: string;
  content: string;
  time: string;
}

export interface Announcement {
  id: string;
  tag: '안내' | '정산' | '점검';
  title: string;
  date: string;
  isRead: boolean;
}
