import { ClientFeaturesResponse as RawFeatures } from '../feature';
import { Context } from '../context';
import { defaultStrategies, Strategy, StrategyTransportInterface } from '../strategy';
import { VariantDefinition } from '../variant';
import { Constraint } from '../strategy/strategy';

export interface Feature {
  name: string;
  type: string;
  description?: string;
  enabled: boolean;
  stale: boolean;
  impressionData: boolean;
  strategies: StrategyTransportInterface[];
  variants: VariantDefinition[];
}

function processFeatures(rawFeatures: RawFeatures): Map<string, Feature> {
  const processedFeatures = new Map<string, Feature>();
  rawFeatures.features.forEach((feature) => {
    processedFeatures.set(feature.name, feature);
  });
  return processedFeatures;
}

export class ToggleEngine {
  features: Map<string, Feature>;

  strategies: Strategy[];

  constructor(rawFeatures: RawFeatures) {
    this.features = processFeatures(rawFeatures);
    this.strategies = [...defaultStrategies];
  }

  private getStrategy(name: string): Strategy | undefined {
    return this.strategies.find((strategy: Strategy): boolean => strategy.name === name);
  }

  *yieldConstraintsFor(
    strategy: StrategyTransportInterface,
  ): IterableIterator<Constraint | undefined> {
    if (strategy.constraints) {
      yield* strategy.constraints;
    }
  }

  isEnabled(featureName: string, context: Context): boolean {
    const feature = this.features.get(featureName);
    if (!feature || !feature.enabled) {
      return false;
    }

    if (!Array.isArray(feature.strategies)) {
      return false;
    }

    if (feature.strategies.length === 0) {
      return false;
    }

    return (
      feature.strategies.length > 0 &&
      feature.strategies.some((strategySelector): boolean => {
        const strategy = this.getStrategy(strategySelector.name);
        if (!strategy) {
          return false;
        }
        const constraints = this.yieldConstraintsFor(strategySelector);
        return strategy.isEnabledWithConstraints(strategySelector.parameters, context, constraints);
      })
    );
  }
}
