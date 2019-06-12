import { Strategy } from './strategy';
import { Context } from '../context';

export class GradualRolloutRandomStrategy extends Strategy {
    constructor() {
        super('gradualRolloutRandom');
    }

    isEnabled(parameters: any, context: Context) {
        const percentage: number = Number(parameters.percentage);
        const random: number = Math.floor(Math.random() * 100) + 1;
        return percentage >= random;
    }
}
