import { Strategy } from './strategy';
import { Context } from '../context';

export class GradualRolloutRandomStrategy extends Strategy {
    private randomGenerator: Function = () => Math.floor(Math.random() * 100) + 1;

    constructor(randomGenerator?: Function) {
        super('gradualRolloutRandom');
        this.randomGenerator = randomGenerator || this.randomGenerator;
    }

    isEnabled(parameters: any, context: Context) {
        const percentage: number = Number(parameters.percentage);
        const random: number = this.randomGenerator();
        return percentage >= random;
    }
}
