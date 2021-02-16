import { once } from 'events';
import { Unleash, UnleashConfig } from './unleash';
import { Variant, getDefaultVariant } from './variant';
import { Context } from './context';

export { Strategy } from './strategy/index';
export { Context, Variant, Unleash };

let instance: Unleash | undefined;
export function initialize(options: UnleashConfig): Unleash {
  if (instance) {
    instance.emit('warn', 'This global unleash instance is initialized multiple times.');
  }
  instance = new Unleash(options);
  instance.on('error', () => {});
  return instance;
}

export async function startUnleash(options: UnleashConfig): Promise<Unleash> {
  const unleash = initialize(options);
  await once(unleash, 'synchronized');
  return unleash;
}

export function isEnabled(name: string, context: Context = {}, fallbackValue?: boolean): boolean {
  return !!instance && instance.isEnabled(name, context, fallbackValue);
}

export function destroy() {
  return instance && instance.destroy();
}

export function getFeatureToggleDefinition(toggleName: string) {
  return instance && instance.getFeatureToggleDefinition(toggleName);
}

export function getFeatureToggleDefinitions() {
  return instance && instance.getFeatureToggleDefinitions();
}

export function getVariant(
  name: string,
  context: Context = {},
  fallbackVariant?: Variant,
): Variant {
  const variant = fallbackVariant || getDefaultVariant();
  return instance ? instance.getVariant(name, context, variant) : variant;
}

export function count(toggleName: string, enabled: boolean) {
  return instance && instance.count(toggleName, enabled);
}

export function countVariant(toggleName: string, variantName: string) {
  return instance && instance.countVariant(toggleName, variantName);
}
