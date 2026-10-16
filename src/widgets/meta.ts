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
  /** 위젯 최소 크기(px). ※ 기획서: 디자인팀 확인 필요 — 임시 값 */
  minWidth: number;
  minHeight: number;
}

export const WIDGETS: Record<WidgetId, WidgetMeta> = {
  donations: { id: 'donations', title: '후원 리스트', description: '받은 후원 목록', icon: List, minWidth: 320, minHeight: 240 },
  quick: { id: 'quick', title: '퀵 제어', description: '일시정지 / 스킵', icon: Gauge, minWidth: 220, minHeight: 90 },
  pending: { id: 'pending', title: '대기 중인 후원', description: '소통을 기다리는 후원', icon: Timer, minWidth: 220, minHeight: 200 },
  volume: { id: 'volume', title: '볼륨 제어', description: '각 기능별 볼륨 조절', icon: Volume2, minWidth: 220, minHeight: 200 },
  usage: { id: 'usage', title: '후원 사용', description: '각 기능 별 사용 ON/OFF 설정', icon: HandCoins, minWidth: 220, minHeight: 200 },
  alerts: { id: 'alerts', title: '후원 알림', description: '각 기능 별 알림 ON/OFF 설정', icon: Bell, minWidth: 220, minHeight: 200 },
  video: { id: 'video', title: '영상 후원 제어', description: '영상 후원 재생 기능 설정', icon: Clapperboard, minWidth: 200, minHeight: 110 },
  drawRemain: { id: 'drawRemain', title: '뽑기 잔여 수량', description: '소진형 뽑기 수량 확인', icon: Box, minWidth: 220, minHeight: 180 },
  vote: { id: 'vote', title: '투표', description: '투표 후원 프리셋 설정', icon: Vote, minWidth: 260, minHeight: 260 },
  crew: { id: 'crew', title: '크루 후원', description: '크루 후원 방송 관리', icon: Users, minWidth: 260, minHeight: 220 },
  toneAd: { id: 'toneAd', title: '투네애드', description: '투네애드 광고 관리', icon: Megaphone, minWidth: 260, minHeight: 200 },
};

/** Dock 아이콘 정렬 순서 (p10 ③). 후원 리스트는 닫을 수 없어 Dock에 없다. */
export const DOCK_ORDER: WidgetId[] = ['quick', 'pending', 'volume', 'usage', 'alerts', 'video', 'drawRemain', 'vote', 'crew', 'toneAd'];

/** 모바일 리모컨 위젯 목록 순서 (p107) */
export const MOBILE_ORDER: WidgetId[] = ['alerts', 'usage', 'volume', 'pending', 'vote', 'drawRemain', 'video', 'toneAd', 'crew'];

/** 분리·닫기·압정이 없는 위젯 (p38 ※ 후원 리스트 위젯 예외 사항) */
export const isFixedWidget = (id: WidgetId) => id === 'donations';
