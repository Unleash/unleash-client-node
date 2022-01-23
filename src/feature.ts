import { StrategyTransportInterface } from './strategy';
// eslint-disable-next-line import/no-cycle
import { VariantDefinition } from './variant';

export interface FeatureInterface {
  name: string;
  description?: string;
  enabled: boolean;
  stale: boolean;
  strategies: StrategyTransportInterface[];
  variants: VariantDefinition[];
}

export interface ClientFeaturesResponse {
  version: number;
  features: FeatureInterface[];
  query?: any;
}
