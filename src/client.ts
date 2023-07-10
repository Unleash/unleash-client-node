import { EventEmitter } from 'events';
import { Strategy, StrategyTransportInterface } from './strategy';
import { FeatureInterface } from './feature';
import { RepositoryInterface } from './repository';
import { Variant, getDefaultVariant, VariantDefinition, selectVariant } from './variant';
import { Context } from './context';
import { Constraint, Segment } from './strategy/strategy';
import { createImpressionEvent, UnleashEvents } from './events';

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
        UnleashEvents.Warn,
        `Missing strategy "${missingStrategy}" for toggle "${name}". Ensure that "${strategies
          .map(({ name: n }) => n)
          .join(', ')}" are supported before using this toggle`,
      );
    }
  }

  isEnabled(name: string, context: Context, fallback: Function): boolean {
    const feature = this.repository.getToggle(name);
    const [enabled] = this.isFeatureEnabled(feature, context, fallback);
    if (feature?.impressionData) {
      this.emit(
        UnleashEvents.Impression,
        createImpressionEvent({
          featureName: name,
          context,
          enabled,
          eventType: 'isEnabled',
        }),
      );
    }
    return enabled;
  }

  isFeatureEnabled(
    feature: FeatureInterface | undefined,
    context: Context,
    fallback: Function,
  ): [boolean, VariantDefinition | undefined] {
    if (!feature) {
      return [fallback(), undefined];
    }

    if (!feature || !feature.enabled) {
      return [false, undefined];
    }

    if (!Array.isArray(feature.strategies)) {
      const msg = `Malformed feature, strategies not an array, is a ${typeof feature.strategies}`;
      this.emit(UnleashEvents.Error, new Error(msg));
      return [false, undefined];
    }

    if (feature.strategies.length === 0) {
      return [feature.enabled, undefined];
    }

    let featureVariant = undefined;

    return [(
      feature.strategies.length > 0 &&

      feature.strategies.some((strategySelector): boolean => {
        const strategy = this.getStrategy(strategySelector.name);
        if (!strategy) {
          this.warnOnce(strategySelector.name, feature.name, feature.strategies);
          return false;
        }
        const constraints = this.yieldConstraintsFor(strategySelector);
        const enabled = strategy.isEnabledWithConstraints(strategySelector.parameters, context, constraints);
        if(enabled && strategySelector?.parameters?.variant) {
          if(typeof strategySelector?.parameters?.variant === 'string') {
            featureVariant = {name: strategySelector?.parameters?.variant, payload: {type: 'string', value: strategySelector?.parameters?.variant}}
          } else {
            featureVariant = strategySelector?.parameters?.variant;
          }
        }
        return enabled;
      })
    ), featureVariant];
  }

  *yieldConstraintsFor(
    strategy: StrategyTransportInterface,
  ): IterableIterator<Constraint | undefined> {
    if (strategy.constraints) {
      yield* strategy.constraints;
    }
    const segments = strategy.segments?.map((segmentId) => this.repository.getSegment(segmentId));
    if (!segments) {
      return;
    }
    yield* this.yieldSegmentConstraints(segments);
  }

  *yieldSegmentConstraints(
    segments: (Segment | undefined)[],
  ): IterableIterator<Constraint | undefined> {
    // eslint-disable-next-line no-restricted-syntax
    for (const segment of segments) {
      if (segment) {
        // eslint-disable-next-line no-restricted-syntax
        for (const constraint of segment?.constraints) {
          yield constraint;
        }
      } else {
        yield undefined;
      }
    }
  }

  getVariant(name: string, context: Context, fallbackVariant?: Variant): Variant {
    const feature = this.repository.getToggle(name);
    const variant = this.resolveVariant(feature, context, true, fallbackVariant);
    if (feature?.impressionData) {
      this.emit(
        UnleashEvents.Impression,
        createImpressionEvent({
          featureName: name,
          context,
          enabled: variant.enabled,
          eventType: 'getVariant',
          variant: variant.name,
        }),
      );
    }
    return variant;
  }

  // This function is intended to close an issue in the proxy where feature enabled
  // state gets checked twice when resolving a variant with random stickiness and
  // gradual rollout. This is not intended for general use, prefer getVariant instead
  forceGetVariant(name: string, context: Context, fallbackVariant?: Variant): Variant {
    const feature = this.repository.getToggle(name);
    return this.resolveVariant(feature, context, false, fallbackVariant);
  }

  private resolveVariant(
    feature: FeatureInterface | undefined,
    context: Context,
    checkToggle: boolean,
    fallbackVariant?: Variant,
  ): Variant {
    const fallback = fallbackVariant || getDefaultVariant();

    if (typeof feature === 'undefined') {
      return fallback;
    }

    let enabled = true;
    let strategyVariant = undefined;
    if (checkToggle) {
      [enabled, strategyVariant] = this.isFeatureEnabled(feature, context, () =>
        fallbackVariant ? fallbackVariant.enabled : false,
      );
      if (!enabled || !feature.variants || !Array.isArray(feature.variants) || feature.variants.length === 0) {
        return fallback;
      }
    }

    if(strategyVariant)  {
      return {name: strategyVariant.name, payload: strategyVariant.payload, enabled: !checkToggle || enabled};
    }

    const variant: VariantDefinition | null = selectVariant(feature, context);
    if (variant === null) {
      return fallback;
    }

    return {
      name: variant.name,
      payload: variant.payload,
      enabled: !checkToggle || enabled,
    };
  }
}
