import { Strategy, Constraint } from './strategy';
import { Context } from '../context';
import { normalizedValue } from './util';

const STICKINESS = {
    default: 'default',
    userId: 'userId',
    sessionId: 'sessionId',
    random: 'random',
};

export class FlexibleRolloutStrategy extends Strategy {
    private randomGenerator: Function = () => Math.round(Math.random() * 100) + 1 + '';

    constructor(radnomGenerator?: Function) {
        super('flexibleRollout');
        if (radnomGenerator) {
            this.randomGenerator = radnomGenerator;
        }
    }

    resolveStickiness(stickiness: string, context: Context): any {
        switch (stickiness) {
            case STICKINESS.userId:
                return context.userId;
            case STICKINESS.sessionId:
                return context.sessionId;
            case STICKINESS.random:
                return this.randomGenerator();
            default:
                return context.userId || context.sessionId || this.randomGenerator();
        }
    }

    isEnabled(parameters: any, context: Context, constraints?: Constraint[]) {
        //TODO v.4.x: Move this out to parent and make it apply for all strategies.
        const constraintsSatisfied = super.checkConstraints(context, constraints);

        if (constraintsSatisfied) {
            const groupId = parameters.groupId || context.featureToggle || '';
            const percentage = Number(parameters.rollout);
            const stickiness = parameters.stickiness || STICKINESS.default;
            const stickinessId = this.resolveStickiness(stickiness, context);

            if (!stickinessId) {
                return false;
            } else {
                const normalizedUserId = normalizedValue(stickinessId, groupId);
                return percentage > 0 && normalizedUserId <= percentage;
            }
        } else {
            return false;
        }
    }
}
