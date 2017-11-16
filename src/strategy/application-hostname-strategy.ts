import { Strategy } from './strategy';
import { hostname } from 'os';

export class ApplicationHostnameStrategy extends Strategy {
    private hostname: string;

    constructor() {
        super('applicationHostname');
        this.hostname = (process.env.HOSTNAME || hostname() || 'undefined').toLowerCase();
    }

    isEnabled(parameters: any) {
        if (!parameters.hostNames) {
            return false;
        }

        return parameters.hostNames
            .toLowerCase()
            .split(/\s*,\s*/)
            .includes(this.hostname);
    }
}
