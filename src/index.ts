import { Unleash, UnleashConfig } from './unleash';

export { Strategy } from './strategy/index';
export { Unleash } from './unleash';

let instance: Unleash | undefined;
export function initialize(options: UnleashConfig): Unleash {
    instance = new Unleash(options);
    instance.on('error', () => {});
    return instance;
}

export function isEnabled(name: string, context: any, fallbackValue?: boolean): boolean {
    return !!instance && instance.isEnabled(name, context, fallbackValue);
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
