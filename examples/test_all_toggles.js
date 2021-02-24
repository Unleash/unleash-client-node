const { initialize, isEnabled, getFeatureToggleDefinitions } = require('../lib');

const client = initialize({
  appName: 'test-all-toggles',
  url: 'https://app.unleash-hosted.com/demo/api',
  metricsInterval: 1000,
  refreshInterval: 5000,
  customHeaders: {
    Authorization: '56907a2fa53c1d16101d509a10b78e36190b0f918d9f122d',
  },
});

client.on('error', console.error);
client.on('warn', console.log);
client.on('unchanged', () => console.error('NOT CHANGED'));
client.on('changed', () => console.log('changed'));

console.log('Fetching toggles from: https://unleash.herokuapp.com');

setInterval(() => {
  getFeatureToggleDefinitions().forEach((t) => {
    console.log(`${t.name}: ${isEnabled(t.name)}`);
  });
}, 1000);
