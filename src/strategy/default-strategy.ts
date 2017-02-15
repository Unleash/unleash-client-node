import { Strategy } from './strategy';

export class DefaultStrategy extends Strategy {
    constructor () {
        super('default');
    }

    isEnabled () {
        return true;
    }
}
