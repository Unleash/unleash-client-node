import { Strategy } from '../lib';

export default class CustomStrategy extends Strategy {
  constructor() {
    super('custom');
  }

  isEnabled() {
    return true;
  }
}
