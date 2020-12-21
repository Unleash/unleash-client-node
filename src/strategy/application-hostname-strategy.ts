import { Context } from '../context';
import { Strategy } from './strategy';

export class ApplicationHostnameStrategy extends Strategy {
    constructor() {
        super('applicationHostname');
    }

    isEnabled(parameters: any, context: Context) {
        if (!parameters.hostNames || !context.referrer) {
            return false;
        }

        return (parameters.hostNames as string)
            .toLowerCase()
            .split(/\s*,\s*/)
            .some($ => context.referrer!.toLowerCase()!.includes($));
    }
}
