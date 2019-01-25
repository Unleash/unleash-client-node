import { StrategyTransportInterface } from './strategy';
import { VariantDefinition } from './variant';

export interface FeatureInterface {
    name: string;
    description?: string;
    enabled: boolean;
    strategies: StrategyTransportInterface[];
    variants: VariantDefinition[];
}
