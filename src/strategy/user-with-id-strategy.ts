import { Strategy } from '../strategy';

class UserWithIdStrategy extends Strategy {
    constructor () {
        super('userWithId');
    }

    isEnabled (parameters, context) {
        const userIdList = parameters.userIds.split(',');
        return userIdList.includes(context.userId);
    }
}