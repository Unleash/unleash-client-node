import { EventEmitter } from 'events';
import { Strategy, StrategyTransportInterface } from './strategy';
import { FeatureInterface } from './feature';
import Repository from './repository';

interface BooleanMap {
    [key: string]: boolean;
}

export default class UnleashClient extends EventEmitter {
    private repository: Repository;
    private strategies: Strategy[];
    private warned: BooleanMap;

    constructor(repository: Repository, strategies: Strategy[]) {
        super();
        this.repository = repository;
        this.strategies = strategies || [];
        this.warned = {};

        this.strategies.forEach((strategy: Strategy) => {
            if (
                !strategy ||
                !strategy.name ||
                typeof strategy.name !== 'string' ||
                !strategy.isEnabled ||
                typeof strategy.isEnabled !== 'function'
            ) {
                throw new Error('Invalid strategy data / interface');
            }
        });
    }

    private getStrategy(name: string): Strategy | undefined {
        return this.strategies.find(
            (strategy: Strategy): boolean => {
                return strategy.name === name;
            },
        );
    }

    warnOnce(missingStrategy: string, name: string, strategies: StrategyTransportInterface[]) {
        if (!this.warned[missingStrategy + name]) {
            this.warned[missingStrategy + name] = true;
            this.emit(
                'warn',
                `Missing strategy "${missingStrategy}" for toggle "${name}". Ensure that "${strategies
                    .map(({ name }) => name)
                    .join(', ')}" are supported before using this toggle`,
            );
        }
    }

    isEnabled(name: string, context: any, fallbackValue?: boolean): boolean {
        const feature: FeatureInterface = this.repository.getToggle(name);

        if (!feature && typeof fallbackValue === 'boolean') {
            return fallbackValue;
        }

        if (!feature || !feature.enabled) {
            return false;
        }

        if (!Array.isArray(feature.strategies)) {
            this.emit(
                'error',
                new Error(
                    `Malformed feature, strategies not an array, is a ${typeof feature.strategies}`,
                ),
            );
            return false;
        }

        if (feature.strategies.length === 0) {
            return feature.enabled;
        }

        return (
            feature.strategies.length > 0 &&
            feature.strategies.some(
                (strategySelector): boolean => {
                    const strategy = this.getStrategy(strategySelector.name);
                    if (!strategy) {
                        this.warnOnce(strategySelector.name, name, feature.strategies);
                        return false;
                    }
                    return strategy.isEnabled(strategySelector.parameters, context);
                },
            )
        );
    }
}
