const { initialize, isEnabled } = require('../lib');

const url = 'http://localhost:4242/api';
const apiToken = '*:development.f17a5c3f54cd912ab16c50583dfd2d1c223c23f01c707804eaa0dcaa';
const toggleName = 'demo001';
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
  const enabled = isEnabled(toggleName, unleashContext);
  console.log(`Enabled: ${enabled}`);
}, 1000);
