import { EventEmitter } from 'events';
import { Strategy, StrategyTransportInterface } from './strategy';
import { FeatureInterface } from './feature';
import { RepositoryInterface } from './repository';
import { Variant, getDefaultVariant, VariantDefinition, selectVariant } from './variant';
import { Context } from './context';

interface BooleanMap {
  [key: string]: boolean;
}

export default class UnleashClient extends EventEmitter {
  private repository: RepositoryInterface;

  private strategies: Strategy[];

  private warned: BooleanMap;

  constructor(repository: RepositoryInterface, strategies: Strategy[]) {
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
    return this.strategies.find((strategy: Strategy): boolean => strategy.name === name);
  }

  warnOnce(missingStrategy: string, name: string, strategies: StrategyTransportInterface[]) {
    if (!this.warned[missingStrategy + name]) {
      this.warned[missingStrategy + name] = true;
      this.emit(
        'warn',
        `Missing strategy "${missingStrategy}" for toggle "${name}". Ensure that "${strategies
          .map(({ name: n }) => n)
          .join(', ')}" are supported before using this toggle`,
      );
    }
  }

  isEnabled(name: string, context: Context, fallback: Function): boolean {
    const feature = this.repository.getToggle(name);
    return this.isFeatureEnabled(feature, context, fallback);
  }

  isFeatureEnabled(feature: FeatureInterface, context: Context, fallback: Function): boolean {
    if (!feature) {
      return fallback();
    }

    if (!feature || !feature.enabled) {
      return false;
    }

    if (!Array.isArray(feature.strategies)) {
      this.emit(
        'error',
        new Error(`Malformed feature, strategies not an array, is a ${typeof feature.strategies}`),
      );
      return false;
    }

    if (feature.strategies.length === 0) {
      return feature.enabled;
    }

    return (
      feature.strategies.length > 0 &&
      feature.strategies.some((strategySelector): boolean => {
        const strategy = this.getStrategy(strategySelector.name);
        if (!strategy) {
          this.warnOnce(strategySelector.name, feature.name, feature.strategies);
          return false;
        }
        return strategy.isEnabledWithConstraints(
          strategySelector.parameters,
          context,
          strategySelector.constraints,
        );
      })
    );
  }

  getVariant(name: string, context: Context, fallbackVariant?: Variant): Variant {
    const fallback = fallbackVariant || getDefaultVariant();
    const feature = this.repository.getToggle(name);
    if (
      typeof feature === 'undefined' ||
      !feature.variants ||
      !Array.isArray(feature.variants) ||
      feature.variants.length === 0
    ) {
      return fallback;
    }

    const enabled = this.isFeatureEnabled(feature, context, () =>
      fallbackVariant ? fallbackVariant.enabled : false,
    );
    if (!enabled) {
      return fallback;
    }

    const variant: VariantDefinition | null = selectVariant(feature, context);
    if (variant === null) {
      return fallback;
    }

    return {
      name: variant.name,
      payload: variant.payload,
      enabled,
    };
  }
}
