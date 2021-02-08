import { Strategy } from './strategy';
import { Context } from '../context';

export default class UserWithIdStrategy extends Strategy {
  constructor() {
    super('userWithId');
  }

  isEnabled(parameters: any, context: Context) {
    const userIdList = parameters.userIds.split(/\s*,\s*/);
    return userIdList.includes(context.userId);
  }
}
