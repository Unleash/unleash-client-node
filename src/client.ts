'use strict';
import { Strategy } from './strategy';
import { FeatureInterface } from './feature';
import Repository from './repository';

export default class UnleashClient {
    private repository: Repository;
    private strategies: Strategy[];
    private errorHandler: (error: Error) => void;

    constructor (repository: Repository, strategies: Strategy[], errorHandler) {
        this.repository     = repository;
        this.errorHandler   = errorHandler || function(){};
        this.strategies     = strategies || [];

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

    isEnabled (name: string, context: any, fallbackValue?: boolean) : boolean {
        const feature: FeatureInterface = this.repository.getToggle(name);

        if (!feature && typeof fallbackValue === 'boolean') {
            return fallbackValue;
        }

        if (!feature || !feature.enabled) {
            return false;
        }

        if (!Array.isArray(feature.strategies)) {
            this.errorHandler(
                new Error(`Malformed feature, strategies not an array, is a ${typeof feature.strategies}`)
            );
            return false;
        }

        if (feature.strategies.length === 0) {
            return feature.enabled;
        }

        return feature.strategies.length > 0 && feature.strategies
            .some((strategySelector) : boolean => {
                const strategy: Strategy = this.getStrategy(strategySelector.name);
                if (!strategy) {
                    this.errorHandler(new Error(`Missing strategy ${strategySelector.name}`));
                    return false;
                }
                return strategy.isEnabled(strategySelector.parameters, context);
            });
    }
}
