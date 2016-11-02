import { Unleash, UnleashConfig } from './unleash';

export { Strategy } from './strategy';
export { Unleash } from './unleash';

let instance;
export function initialize (options: UnleashConfig) {
    instance = new Unleash(options);
    instance.on('error', () => {});
    return instance;
};

export function isEnabled (name: string, context: any, fallbackValue?: boolean) {
    return instance && instance.isEnabled(name, context, fallbackValue);
};

export function destroy () {
    return instance && instance.destroy();
};
