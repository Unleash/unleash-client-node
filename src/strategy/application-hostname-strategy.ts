import { Strategy } from '../strategy';
import { hostname } from 'os';

export class ApplicationHostnameStrategy extends Strategy {
    private hostname : string;

    constructor () {
        super('applicationHostname');
        this.hostname = process.env.HOSTNAME || hostname();
    }

    isEnabled (parameters: any) {
        const hostNames = parameters.hostNames.split(/\s*,\s*/);
        return hostNames.includes(this.hostname);
    }
}
