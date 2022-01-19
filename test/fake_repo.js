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

  start() {
    
  }

  getToggle() {
    return this.data;
  }
}
