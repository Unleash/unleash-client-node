import { Strategy } from '../strategy';

export default class DefaultStrategy extends Strategy {
    constructor () {
        super('default');
    }

    isEnabled (parameters, context) {
        return true;
    }
}