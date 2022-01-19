const { EventEmitter } = require('events');
const { initialize, isEnabled } = require('../lib');
const { UnleashEvents } = require('../lib/events');

class MyRepo extends EventEmitter {
  constructor() {
    super();
    this.data = {
      name: 'my-feature',
      description: 'foo',
      enabled: true,
      strategies: [],
      variants: [],
    };
  }

  stop() {

  }

  getToggle() {
    return this.data;
  }
}
const repo = new MyRepo();
const client = initialize({
  appName: 'my-application',
  url: 'not-needed',
  disableMetrics: true,
  repository: repo,
});
repo.emit(UnleashEvents.Ready);

client.on('error', console.error);
client.on('warn', console.log);

console.log(`feature enabled: ${isEnabled('THE-feature')}`);
