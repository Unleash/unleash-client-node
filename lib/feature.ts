import { StrategyTransportInterface } from './strategy';

export interface FeatureInterface {
    name: string,
    description?: string,
    enabled: boolean,
    strategies: StrategyTransportInterface[]
}