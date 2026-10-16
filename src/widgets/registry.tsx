import type { ComponentType } from 'react';
import type { WidgetId } from '../types';
import Alerts from './Alerts';
import Crew from './Crew';
import DonationList from './donations/DonationList';
import { DrawStock } from './DrawStock';
import Pending from './Pending';
import QuickControl from './QuickControl';
import ToneAd from './ToneAd';
import Usage from './Usage';
import VideoControl from './VideoControl';
import Volume from './Volume';
import VoteWidget from './VoteWidget';

const DrawRemain = () => (
  <div className="p-3">
    <DrawStock />
  </div>
);

export const WIDGET_COMPONENTS: Record<WidgetId, ComponentType> = {
  donations: DonationList,
  quick: () => <QuickControl />,
  pending: Pending,
  volume: Volume,
  usage: Usage,
  alerts: Alerts,
  video: VideoControl,
  drawRemain: DrawRemain,
  vote: VoteWidget,
  crew: Crew,
  toneAd: ToneAd,
};
