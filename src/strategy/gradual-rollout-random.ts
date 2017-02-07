import { Strategy } from '../strategy';

export class GradualRolloutRandomStrategy extends Strategy {
    constructor () {
        super('gradualRolloutRandom');
    }

    isEnabled (parameters, context) {
        const percentage = +parameters.percentage;
        const random = Math.round(Math.random() * 100);
        return percentage >= random;
    }
}