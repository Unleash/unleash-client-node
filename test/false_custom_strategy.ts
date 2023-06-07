import { Strategy } from '../lib';

export default class CustomFalseStrategy extends Strategy {
  constructor() {
    super('custom-false');
  }

  isEnabled() {
    return false;
  }
}
