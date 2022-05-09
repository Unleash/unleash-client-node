const { initialize, isEnabled } = require('../lib');

const url = 'http://localhost:4242/api/';
const apiToken = '*:development.5ec41f4a67313faa2499a33b56a4d8aa1547c7ad1ef2af8f517f0fa5';
const toggleName = 'AWholeNewToggle';
const unleashContext = {
};

const client = initialize({
  appName: 'BOB',
  url,
  refreshInterval: 1000,
  customHeaders: {
    Authorization: apiToken,
  }
});

client.on('error', console.error);
client.on('warn', console.log);
client.on('ready', () => {
  console.log('ready!')
});

console.log(`Fetching toggles from: ${url}`);

setInterval(() => {
  const enabled = isEnabled(toggleName, unleashContext);
  console.log(`Enabled: ${enabled}`);
}, 1000);