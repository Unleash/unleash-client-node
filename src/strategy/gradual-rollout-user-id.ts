import { Strategy } from '../strategy';
import { normalizedValue } from './util';

export default class GradualRolloutUserIdStrategy extends Strategy {
    constructor () {
        super('gradualRolloutUserId');
    }

    isEnabled (parameters, context) {
        const userId = context.userId;
        if(!userId) {
            return false;
        }

        const percentage = +parameters.percentage;
        const groupId = parameters.groupId || '';
        
        const normalizedUserId = normalizedValue(userId, groupId);

        return percentage > 0 && normalizedUserId <= percentage;
    }
}