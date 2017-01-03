'use strict';
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

    constructor (repository: Repository, strategies: Strategy[]) {
        super();
        this.repository     = repository;
        this.strategies     = strategies || [];
        this.warned         = {};

        strategies.forEach((strategy: Strategy) => {
            if (!strategy ||
                !strategy.name ||
                typeof strategy.name !== 'string' ||
                !strategy.isEnabled ||
                typeof strategy.isEnabled !== 'function'
            ) {
                throw new Error('Invalid strategy data / interface');
            }
        });
    }

    private getStrategy (name: string) : Strategy {
        let match;
        this.strategies.some((strategy: Strategy) : boolean => {
            if (strategy.name === name) {
                match = strategy;
                return true;
            }
            return false;
        });
        return match;
    }

    warnOnce (missingStrategy: string, name: string, strategies: StrategyTransportInterface[]) {
        if (!this.warned[missingStrategy + name]) {
            this.warned[missingStrategy + name] = true;
            this.emit('warn', `Missing strategy "${missingStrategy}" for toggle "${
                name}". Ensure that "${
                    strategies.map(({ name }) => name).join(', ')}" are supported before using this toggle`);
        }
    }

    isEnabled (name: string, context: any, fallbackValue?: boolean) : boolean {
        const feature: FeatureInterface = this.repository.getToggle(name);

        if (!feature && typeof fallbackValue === 'boolean') {
            return fallbackValue;
        }

        if (!feature || !feature.enabled) {
            return false;
        }

        if (!Array.isArray(feature.strategies)) {
            this.emit('error',
                new Error(`Malformed feature, strategies not an array, is a ${typeof feature.strategies}`)
            );
            return false;
        }

        if (feature.strategies.length === 0) {
            return feature.enabled;
        }

        let missingStrategy;

        function hasNext (currentIndex) {
            if (feature.strategies[currentIndex + 1]) {
                return true;
            }
        }

        function nextIsAND (currentIndex) {
            if (feature.strategies[currentIndex + 1].operator === 'AND') {
                return true;
            }
        }

        function nextIsOR (currentIndex) {
            if (feature.strategies[currentIndex + 1].operator !== 'AND') {
                return true;
            }
        }

        function getNextORIndex (currentIndex) {
            for (let i = currentIndex + 1; i < feature.strategies.length; i ++) {
                if (feature.strategies[i].operator !== 'AND') {
                    return i;
                }
            }
            return null;
        }

        for (let i = 0; i < feature.strategies.length; i++) {
            const strategySelector: StrategyTransportInterface = feature.strategies[i];
            const strategy: Strategy = this.getStrategy(strategySelector.name);

            if (!strategy) {
                this.warnOnce(strategySelector.name, name, feature.strategies);
                missingStrategy = true;
                break;
            }

            const result = strategy.isEnabled(strategySelector.parameters, context);

            if (!hasNext(i)) {
                return result;
            }

            if (result === false && nextIsOR(i)) {
                continue;
            }

            if (result === true) {
                if (nextIsOR(i)) {
                    return result;
                }
                continue;
            }

            const nextIndex = getNextORIndex(i);
            if (
                typeof nextIndex === 'number' &&
                hasNext(nextIndex - 1)
            ) {
                i = nextIndex - 1;
                continue;
            }
            return result;
        }

        if (missingStrategy) {
            return false;
        }

        return false;
    }
}
