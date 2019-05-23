import { Strategy, Constraint, Operator } from './strategy';
import { Context } from '../context';
import { normalizedValue } from './util';

export class MatchingStrategy extends Strategy {
    constructor() {
        super('MatchingStrategy');
    }

    checkConstraint(constraint: Constraint, context: Context) {
        const contextValue = context[constraint.contextName];
        const isIn = constraint.values.some(val => val.trim() === contextValue);
        return constraint.operator === Operator.IN ? isIn : !isIn;
    }

    checkConstraints(context: Context, constraints?: Constraint[]) {
        if (!constraints) {
            return true;
        }
        return constraints.every(constraint => this.checkConstraint(constraint, context));
    }

    isEnabled(parameters: any, context: Context, constraints?: Constraint[]) {
        //Step 1: all constraints must be satisfied.
        const constraintsSatisfied = this.checkConstraints(context, constraints);

        if (constraintsSatisfied) {
            const stickiness =
                context.userId || context.sessionId || Math.round(Math.random() * 100) + 1 + '';

            const percentage = Number(parameters.rollout);
            const groupId = parameters.groupId || '';

            const normalizedUserId = normalizedValue(stickiness, groupId);

            return percentage > 0 && normalizedUserId <= percentage;
        } else {
            return false;
        }
    }
}
