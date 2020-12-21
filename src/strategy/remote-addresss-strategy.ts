import { Strategy } from './strategy';
import { Context } from '../context';
import * as IPCDIR from 'ip-cidr';

export class RemoteAddressStrategy extends Strategy {
    constructor() {
        super('remoteAddress');
    }

    isEnabled(parameters: any, context: Context) {
        if (!parameters.IPs) {
            return false;
        }
        for (const range of parameters.IPs.split(/\s*,\s*/)) {
            try {
                if (range === context.remoteAddress) {
                    return true;
                } else if (
                    context.remoteAddress &&
                    new IPCDIR(range).contains(context.remoteAddress)
                ) {
                    return true;
                }
            } catch (e) {
                continue;
            }
        }
        return false;
    }
}
