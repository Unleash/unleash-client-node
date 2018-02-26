import { Unleash, UnleashConfig } from './unleash';
import { Variant } from './variant';

export { Strategy, Experiment } from './strategy/index';
export { Variant } from './variant';
export { Unleash } from './unleash';

let instance;
export function initialize(options: UnleashConfig): Unleash {
    instance = new Unleash(options);
    instance.on('error', () => {});
    return instance;
}

export function isEnabled(name: string, context: any, fallbackValue?: boolean): boolean {
    return instance && instance.isEnabled(name, context, fallbackValue);
}

export function destroy() {
    return instance && instance.destroy();
}

export function getFeatureToggleDefinition(toggleName: string) {
    return instance && instance.getFeatureToggleDefinition(toggleName);
}

export function count(toggleName: string, enabled: boolean) {
    return instance && instance.count(toggleName, enabled);
}

export function experiment(name: string, context: any, fallbackVariant?: Variant): null | Variant {
    return instance && instance.experiment(name, context, fallbackVariant);
}
