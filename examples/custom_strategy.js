const { Strategy, initialize, isEnabled } = require('../lib');

// Define custom strategy:
class ActiveForUserWithEmailStrategy extends Strategy {
  constructor() {
    super('ActiveForUserWithEmail');
  }

  isEnabled(parameters, context) {
    return parameters.emails.includes(context.email);
  }
}

const client = initialize({
  appName: 'my-application',
  url: 'https://unleash-new-ui.herokuapp.com/api/',
  refreshInterval: 5000,
  metricsInterval: 5000,
  strategies: [new ActiveForUserWithEmailStrategy()],
});

client.on('error', console.error);
client.on('warn', console.log);

console.log('Fetching toggles from: https://unleash-new-ui.herokuapp.com', client);

setInterval(() => {
  console.log(`Test enabled: ${isEnabled('Test', { userId: '1234' })}`);
}, 1000);

setInterval(() => {
  console.log(`Test enabled: ${isEnabled('Test', { userId: '12' })}`);
}, 1000);
