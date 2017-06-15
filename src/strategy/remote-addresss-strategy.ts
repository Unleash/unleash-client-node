import { Strategy } from './strategy';
import { Context } from '../context';

export class RemoteAddressStrategy extends Strategy {
    constructor() {
        super('remoteAddress');
    }

    isEnabled(parameters: any, context: Context) {
        if (!parameters.IPs) {
            return false;
        }
        const ipList = parameters.IPs.split(/\s*,\s*/);
        return ipList.includes(context.remoteAddress);
    }
}
