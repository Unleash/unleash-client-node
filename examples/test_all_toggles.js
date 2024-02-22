const { initialize, isEnabled, getVariant, getFeatureToggleDefinitions } = require('../lib');

const url = process.env.UNLEASH_API_URL || 'https://app.unleash-hosted.com/demo/api';
const apiKey = process.env.UNLEASH_API_KEY || '56907a2fa53c1d16101d509a10b78e36190b0f918d9f122d';
const client = initialize({
  appName: 'test-all-toggles',
  url,
  metricsInterval: 2000,
  refreshInterval: 1000,
  customHeaders: {
    Authorization: apiKey,
  },
});

client.on('error', console.error);
client.on('warn', console.log);
// client.on('unchanged', () => console.error('NOT CHANGED'));
client.on('changed', () => console.log('CHANGED!'));

console.log(`Fetching toggles from: ${url}`);

setInterval(() => {
  const userId = Math.random() * 1000;
  process.stdout.write('\u001b[2J\u001b[0;0H');
  console.log(`current userId: ${userId}`);
  getFeatureToggleDefinitions()
    .sort((a, b) => {
      if (a.name.toLocaleLowerCase() > b.name.toLocaleLowerCase()) return 1;
      if (a.name.toLocaleLowerCase() < b.name.toLocaleLowerCase()) return -1;
      return 0;
    })
    .forEach((t) => {
      console.log(`${t.name} (${t.project}): 
    Enabled: ${isEnabled(t.name, { userId })} \t Variant: ${getVariant(t.name, { userId }).name}
    `);
    });
}, 1000);
