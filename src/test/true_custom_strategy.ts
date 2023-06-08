// @ts-nocheck
import { Strategy } from '..';

export default class CustomStrategy extends Strategy {
  constructor() {
    super('custom');
  }

  isEnabled() {
    return true;
  }
}
