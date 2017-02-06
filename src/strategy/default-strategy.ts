import { Strategy } from '../strategy';

export class DefaultStrategy extends Strategy {
    constructor () {
        super('default');
    }

    isEnabled (parameters, context) {
        return true;
    }
}