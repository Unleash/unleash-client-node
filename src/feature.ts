import { StrategyTransportInterface } from './strategy';
import { Variant } from './variant';

export interface FeatureInterface {
    name: string;
    description?: string;
    enabled: boolean;
    strategies: StrategyTransportInterface[];
    variants: Variant[];
}
