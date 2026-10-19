import {
  Box,
  Clapperboard,
  Gauge,
  HandCoins,
  List,
  Megaphone,
  Bell,
  Timer,
  Users,
  Volume2,
  Vote,
  type LucideIcon,
} from 'lucide-react';
import type { WidgetId } from '../types';

export interface WidgetMeta {
  id: WidgetId;
  title: string;
  /** 모바일 리모컨 위젯 목록 설명 (p107) */
  description: string;
  icon: LucideIcon;
}

// 최소 크기는 Ground Control과 같은 규칙을 쓴다.
// 위젯마다 고정 최소값을 두지 않고, 경계를 끌 때 같은 그룹 크기의 10%까지 줄어든다.
/** 리사이즈 때 위젯이 줄어들 수 있는 한계 = 그룹 크기 × 이 비율 */
export const PANEL_MIN_RATIO = 0.1;
/** 그래도 헤더(높이 40px)와 닫기 버튼은 보이도록 두는 하한(px). 독립창 최소 크기는 electron/main.ts */
export const WIDGET_MIN = { width: 80, height: 40 };

export const WIDGETS: Record<WidgetId, WidgetMeta> = {
  donations: { id: 'donations', title: '후원 리스트', description: '받은 후원 목록', icon: List },
  quick: { id: 'quick', title: '퀵 제어', description: '일시정지 / 스킵', icon: Gauge },
  pending: { id: 'pending', title: '대기 중인 후원', description: '소통을 기다리는 후원', icon: Timer },
  volume: { id: 'volume', title: '볼륨 제어', description: '각 기능별 볼륨 조절', icon: Volume2 },
  usage: { id: 'usage', title: '후원 사용', description: '각 기능 별 사용 ON/OFF 설정', icon: HandCoins },
  alerts: { id: 'alerts', title: '후원 알림', description: '각 기능 별 알림 ON/OFF 설정', icon: Bell },
  video: { id: 'video', title: '영상 후원 제어', description: '영상 후원 재생 기능 설정', icon: Clapperboard },
  drawRemain: { id: 'drawRemain', title: '뽑기 잔여 수량', description: '소진형 뽑기 수량 확인', icon: Box },
  vote: { id: 'vote', title: '투표', description: '투표 후원 프리셋 설정', icon: Vote },
  crew: { id: 'crew', title: '크루 후원', description: '크루 후원 방송 관리', icon: Users },
  toneAd: { id: 'toneAd', title: '투네애드', description: '투네애드 광고 관리', icon: Megaphone },
};

/** Dock 아이콘 정렬 순서 (p10 ③). 후원 리스트는 닫을 수 없어 Dock에 없다. */
export const DOCK_ORDER: WidgetId[] = ['quick', 'pending', 'volume', 'usage', 'alerts', 'video', 'drawRemain', 'vote', 'crew', 'toneAd'];

/** 모바일 리모컨 위젯 목록 순서 (p107) */
export const MOBILE_ORDER: WidgetId[] = ['alerts', 'usage', 'volume', 'pending', 'vote', 'drawRemain', 'video', 'toneAd', 'crew'];

/** 분리·닫기·압정이 없는 위젯 (p38 ※ 후원 리스트 위젯 예외 사항) */
export const isFixedWidget = (id: WidgetId) => id === 'donations';
