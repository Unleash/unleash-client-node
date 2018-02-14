import { EventEmitter } from 'events';
import { Strategy, StrategyTransportInterface } from './strategy/index';
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

    private getStrategy(name: string): Strategy {
        let match;
        this.strategies.some((strategy: Strategy): boolean => {
            if (strategy.name === name) {
                match = strategy;
                return true;
            }
            return false;
        });
        return match;
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

        const handler = strategySelector => {
            if (Array.isArray(strategySelector.group)) {
                let groupResult = false;
                strategySelector.group.some((groupedStrategy, index, list) => {
                    const result = handler(groupedStrategy);

                    if (result === false) {
                        groupResult = false;
                        // abort loop if AND;
                        return groupedStrategy.operator === 'AND';
                    }

                    // if last in group, resolve this group
                    if (index + 1 === list.length) {
                        groupResult = result;
                        return true;
                    }
                    // if result is true, and next entry should be resolved as well
                    if (groupedStrategy.operator === 'AND') {
                        // continue loop
                        return false;
                    }
                    groupResult = result;
                    return result;
                });
                return groupResult;
            }

            const strategy: Strategy = this.getStrategy(strategySelector.name);
            if (!strategy) {
                this.warnOnce(
                    strategySelector.name,
                    name,
                    strategySelector.group || feature.strategies,
                );
                return false;
            }

            return strategy.isEnabled(strategySelector.parameters, context);
        };

        return feature.strategies.some(handler);
    }
}
