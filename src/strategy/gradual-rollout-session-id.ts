import { Strategy } from '../strategy';
import { normalizedValue } from './util';

export class GradualRolloutSessionIdStrategy extends Strategy {
    constructor () {
        super('gradualRolloutSessionId');
    }

    isEnabled (parameters, context) {
        const sessionId = context.sessionId;
        if(!sessionId) {
            return false;
        }

        const percentage = +parameters.percentage;
        const groupId = parameters.groupId || '';
        
        const normalizedId = normalizedValue(sessionId, groupId);

        return percentage > 0 && normalizedId <= percentage;
    }
}