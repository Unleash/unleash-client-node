const { isEnabled, run, initialize } = require('../lib');

const url = 'http://localhost:4242/api';
const apiToken = '*:development.f374c0278e4601ee9f15f96bd7d36380cf8b1f603029fb3ba7b9105d';
const unleashContext = { userId: '1232' };

const unleash = initialize({
  appName: 'my-application',
  url,
  refreshInterval: 1000,
  customHeaders: {
    Authorization: apiToken,
  },
});

unleash.on('error', console.error);
unleash.on('warn', console.log);
unleash.on('ready', () => {
  console.log('ready!');
});

console.log(`Fetching toggles from: ${url}`);

setInterval(() => {
  run({
    toggleName: 'default',
    onEnabled: () => {
      console.log('Toggle is enabled!');
    },
    onDisabled: () => {
      console.log('Toggle is disabled!');
    },
  });
  const enabled = isEnabled('default', unleashContext);
  console.log(`Enabled: ${enabled}`);
}, 300);
