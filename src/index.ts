import { Unleash, UnleashConfig } from './unleash';
import { Variant, getDefaultVariant } from './variant';
import { Context } from './context';

export { Strategy } from './strategy/index';
export { Unleash } from './unleash';

let instance: Unleash | undefined;
export function initialize(options: UnleashConfig): Unleash {
    instance = new Unleash(options);
    instance.on('error', () => {});
    return instance;
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

export function getVariant(
    name: string,
    context: Context = {},
    fallbackVariant?: Variant,
): Variant {
    if (!fallbackVariant) {
        fallbackVariant = getDefaultVariant();
    }
    return instance ? instance.getVariant(name, context, fallbackVariant) : fallbackVariant;
}

export function count(toggleName: string, enabled: boolean) {
    return instance && instance.count(toggleName, enabled);
}

export function countVariant(toggleName: string, variantName: string) {
    return instance && instance.countVariant(toggleName, variantName);
}
