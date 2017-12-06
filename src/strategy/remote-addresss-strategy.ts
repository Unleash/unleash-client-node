import { Strategy } from './strategy';
import { Context } from '../context';
const ip = require('ip');

export class RemoteAddressStrategy extends Strategy {
    constructor() {
        super('remoteAddress');
    }

    isEnabled(parameters: any, context: Context) {
        if (!parameters.IPs) {
            return false;
        }
        for (const range of parameters.IPs.split(/\s*,\s*/)) {
            if (range === context.remoteAddress) {
                return true;
            } else if (!ip.isV6Format(range)) {
                if (ip.cidrSubnet(range).contains(context.remoteAddress)) {
                    return true;
                }
            }
        }
        return false;
    }
}
