import { EventEmitter } from 'events';

export default class FakeRepo extends EventEmitter {
  constructor() {
    super();
    this.data = {
      name: 'fake-feature',
      enabled: false,
      strategies: [],
    };
  }

  stop() {

  }

  getToggle() {
    return this.data;
  }
}
