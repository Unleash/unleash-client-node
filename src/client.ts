import { EventEmitter } from 'events';
import { Strategy, StrategyTransportInterface } from './strategy/index';
import { FeatureInterface } from './feature';
import { Variant } from './variant';
import Repository from './repository';
import { Experiment } from './strategy/strategy';
import { experiment } from './index';

interface BooleanMap {
    [key: string]: boolean;
}

interface ExperimentedStrategy {
    selector: StrategyTransportInterface;
    variant: null | Variant;
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

    private getStrategy(name: string): Experiment;
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

    private getSimpleStrategies(strategySelector): Function {
        return strategySelector => {
            const strategy = this.strategies.find(
                strategy => strategySelector.name === strategy.name,
            );
            return strategy && !(strategy instanceof Experiment);
        };
    }

    private getExperimentStrategies(strategySelector): Function {
        return strategySelector => {
            const strategy = this.strategies.find(
                strategy => strategySelector.name === strategy.name,
            );
            return strategy && strategy instanceof Experiment;
        };
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
            feature.strategies.some((strategySelector): boolean => {
                const strategy: Strategy = this.getStrategy(strategySelector.name);
                if (!strategy) {
                    this.warnOnce(strategySelector.name, name, feature.strategies);
                    return false;
                }
                return strategy.isEnabled(strategySelector.parameters, context);
            })
        );
    }

    experiment(name: string, context: any, fallbackVariant?: Variant): null | Variant {
        const feature: FeatureInterface = this.repository.getToggle(name);

        if (!feature && fallbackVariant instanceof Variant) {
            return fallbackVariant;
        }

        if (!feature || !feature.enabled) {
            return null;
        }

        if (!Array.isArray(feature.strategies)) {
            this.emit(
                'error',
                new Error(
                    `Malformed feature, strategies not an array, is a ${typeof feature.strategies}`,
                ),
            );
            return null;
        }

        if (feature.strategies.length === 0) {
            return null;
        }

        let simpleStrategies: boolean = false;
        const target = feature.strategies.some((strategySelector): boolean => {
            const strategy: Strategy = this.getStrategy(strategySelector.name);
            if (!strategy) {
                this.warnOnce(strategySelector.name, name, feature.strategies);
                return false;
            }

            if (strategy instanceof Experiment) {
                return false;
            }

            simpleStrategies = true;

            return strategy.isEnabled(strategySelector.parameters, context);
        });

        if (simpleStrategies && !target) {
            return null;
        }

        return (
            feature.strategies
                .map(strategySelector => {
                    // lets map a new objects array to hold the final variant result
                    const experimentStrategy: ExperimentedStrategy = {
                        selector: strategySelector,
                        variant: null,
                    } as ExperimentedStrategy;

                    return experimentStrategy;
                })
                .find((experimentStrategy): any => {
                    const experimentSelector = experimentStrategy.selector;
                    const experiment: Experiment = this.getStrategy(experimentSelector.name);
                    if (!experiment) {
                        this.warnOnce(experimentSelector.name, name, feature.strategies);
                        return false;
                    }

                    if (!(experiment instanceof Experiment)) {
                        return false;
                    }

                    context = Object.assign({ variants: feature.variants }, context);
                    experimentStrategy.variant = experiment.experiment(
                        experimentSelector.parameters,
                        context,
                    );
                    return experimentStrategy.variant;
                }) ||
            ({
                selector: {} as StrategyTransportInterface,
                variant: null,
            } as ExperimentedStrategy)
        ).variant;
    }
}
