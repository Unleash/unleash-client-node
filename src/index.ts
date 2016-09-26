import { Unleash, UnleashConfig } from './unleash';

export { Strategy } from './strategy';
export { Unleash } from './unleash';

let instance;
export function initialize (options: UnleashConfig) {
    instance = new Unleash(options);
    return instance;
};

export function isEnabled (name: string, context: any) {
    return instance && instance.isEnabled(name, context);
};

export function destroy () {
    return instance && instance.destroy();
};
