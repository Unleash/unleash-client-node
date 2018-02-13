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

    warnOnce(missingStrategy: string, name: string) {
        if (!this.warned[missingStrategy + name]) {
            this.warned[missingStrategy + name] = true;
            this.emit('warn', `Missing strategy "${missingStrategy}" for toggle "${name}"`);
        }
    }

    strategyEvaluator(
        strategySelector: StrategyTransportInterface,
        feature: FeatureInterface,
        context: any,
    ): boolean {
        if (strategySelector.type === 'group') {
            const operator = strategySelector.operator || 'OR';
            const strategies = strategySelector.strategies || [];
            return this.strategyGroupEvaluator(operator, strategies, feature, context);
        } else {
            const strategy: Strategy = this.getStrategy(strategySelector.name);
            if (!strategy) {
                this.warnOnce(strategySelector.name, feature.name);
                return false;
            } else {
                return strategy.isEnabled(strategySelector.parameters, context);
            }
        }
    }

    strategyGroupEvaluator(
        operator: string,
        strategies: Array<StrategyTransportInterface>,
        feature: FeatureInterface,
        context: any,
    ): boolean {
        const evaluator = strategySelector =>
            this.strategyEvaluator(strategySelector, feature, context);
        if (operator === 'AND') {
            return strategies.every(evaluator);
        } else {
            return strategies.some(evaluator);
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

        // TODO: Do we need this?
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

        // Outer group is always OR
        return this.strategyGroupEvaluator('OR', feature.strategies, feature, context);
    }
}
