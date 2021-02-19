const { initialize, isEnabled } = require('../lib');

const client = initialize({
  appName: 'my-application',
  url: 'http://unleash2.herokuapp.com/api/',
  refreshInterval: 1,
  metricsInterval: 100,
});

client.on('error', console.error);
client.on('warn', console.log);

console.log('Fetching toggles from: http://unleash.herokuapp.com');

setInterval(() => {
  console.log(`featureX enabled: ${isEnabled('featureX')}`);
}, 100);
