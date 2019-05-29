import { Strategy, Constraint, Operator } from './strategy';
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
        super('FlexibleRollout');
        if (radnomGenerator) {
            this.randomGenerator = radnomGenerator;
        }
    }

    checkConstraint(constraint: Constraint, context: Context) {
        const field = constraint.contextName;
        const contextValue = context[field] ? context[field] : context.properties[field];
        const isIn = constraint.values.some(val => val.trim() === contextValue);
        return constraint.operator === Operator.IN ? isIn : !isIn;
    }

    checkConstraints(context: Context, constraints?: Constraint[]) {
        if (!constraints) {
            return true;
        }
        return constraints.every(constraint => this.checkConstraint(constraint, context));
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
        const constraintsSatisfied = this.checkConstraints(context, constraints);

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
