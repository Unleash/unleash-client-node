import { Strategy } from '../';

export default class CustomFalseStrategy extends Strategy {
  constructor() {
    super('custom-false');
  }

  isEnabled() {
    return false;
  }
}
