import { Strategy, Constraint } from './strategy';
import { Context } from '../context';
import { normalizedValue } from './util';

export class MatchingStrategy extends Strategy {
    constructor() {
        super('MatchingStrategy');
    }

    isEnabled(parameters: any, context: Context, constraints?: Constraint[]) {
        //Step 1: all constraints must be satisfied.

        const allAccepted = constraints
            ? constraints.every(constraint =>
                  constraint.values.some(v => v.trim() === context[constraint.contextName]),
              )
            : false;

        if (allAccepted) {
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
