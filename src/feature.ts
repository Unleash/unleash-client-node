import { StrategyTransportInterface } from './strategy';
import { EnhancedStrategyTransportInterface, Segment } from './strategy/strategy';
// eslint-disable-next-line import/no-cycle
import { VariantDefinition } from './variant';

export interface Dependency {
  feature: string;
  variants?: string[];
  enabled?: boolean;
}

export interface FeatureInterface {
  name: string;
  type?: string;
  project?: string;
  description?: string;
  enabled: boolean;
  stale?: boolean;
  impressionData?: boolean;
  strategies?: StrategyTransportInterface[];
  variants?: VariantDefinition[];
  dependencies?: Dependency[];
}

export interface EnhancedFeatureInterface extends Omit<FeatureInterface, 'strategies'> {
  strategies?: EnhancedStrategyTransportInterface[];
}

export interface ClientFeaturesResponse {
  version: number;
  features: FeatureInterface[];
  segments?: Segment[];
  query?: any;
}

export interface ClientFeaturesDelta {
  events: DeltaEvent[];
}

export type DeltaEvent =
  | FeatureUpdated
  | FeatureRemoved
  | SegmentUpdated
  | SegmentRemoved
  | Hydration;

export type FeatureUpdated = {
  type: 'feature-updated';
  eventId: number;
  feature: FeatureInterface;
};

export type FeatureRemoved = {
  type: 'feature-removed';
  eventId: number;
  featureName: string;
  project: string;
};

export type SegmentUpdated = {
  type: 'segment-updated';
  eventId: number;
  segment: Segment;
};

export type SegmentRemoved = {
  type: 'segment-removed';
  eventId: number;
  segmentId: number;
};

export type Hydration = {
  type: 'hydration';
  eventId: number;
  features: FeatureInterface[];
  segments: Segment[];
};
