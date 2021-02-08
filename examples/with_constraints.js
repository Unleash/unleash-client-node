const { initialize, isEnabled } = require('../lib');

const client = initialize({
  appName: 'my-application',
  environment: 'test',
  refreshInterval: 1000,
  url: 'http://unleash.herokuapp.com/api/',
});

client.on('error', console.error);
client.on('warn', console.log);

console.log('Fetching toggles from: http://unleash.herokuapp.com');

setInterval(() => {
  console.log(`demo enabled: ${isEnabled('demo')}`);
}, 1000);
