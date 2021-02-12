import { Context } from './context';
// eslint-disable-next-line import/no-cycle
import { FeatureInterface } from './feature';
import normalizedValue from './strategy/util';
import { resolveContextValue } from './helpers';

enum PayloadType {
  STRING = 'string',
}

interface Override {
  contextName: string;
  values: String[];
}

export interface Payload {
  type: PayloadType;
  value: string;
}

export interface VariantDefinition {
  name: string;
  weight: number;
  payload: Payload;
  overrides: Override[];
}

export interface Variant {
  name: string;
  enabled: boolean;
  payload?: Payload;
}

export function getDefaultVariant(): Variant {
  return {
    name: 'disabled',
    enabled: false,
  };
}

const stickynessSelectors = ['userId', 'sessionId', 'remoteAddress'];
function getSeed(context: Context): string {
  let result;
  stickynessSelectors.some((key: string): boolean => {
    const value = context[key];
    if (typeof value === 'string' && value !== '') {
      result = value;
      return true;
    }
    return false;
  });
  return result || String(Math.round(Math.random() * 100000));
}

function overrideMatchesContext(context: Context): (o: Override) => boolean {
  return (o: Override) =>
    o.values.some((value) => value === resolveContextValue(context, o.contextName));
}

function findOverride(feature: FeatureInterface, context: Context): VariantDefinition | undefined {
  return feature.variants
    .filter((variant) => variant.overrides)
    .find((variant) => variant.overrides.some(overrideMatchesContext(context)));
}

export function selectVariant(
  feature: FeatureInterface,
  context: Context,
): VariantDefinition | null {
  const totalWeight = feature.variants.reduce((acc, v) => acc + v.weight, 0);
  if (totalWeight <= 0) {
    return null;
  }
  const variantOverride = findOverride(feature, context);
  if (variantOverride) {
    return variantOverride;
  }
  const target = normalizedValue(getSeed(context), feature.name, totalWeight);

  let counter = 0;
  const variant = feature.variants.find((v: VariantDefinition): VariantDefinition | undefined => {
    if (v.weight === 0) {
      return undefined;
    }
    counter += v.weight;
    if (counter < target) {
      return undefined;
    }
    return v;
  });
  return variant || null;
}
