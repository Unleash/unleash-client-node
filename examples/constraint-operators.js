const { initialize, isEnabled } = require('../lib');

const client = initialize({
  appName: 'my-application',
  url: 'http://localhost:4242/api/',
  refreshInterval: 1000,
  customHeaders: {
    Authorization: '*:development.7d9ca8d289c1545f1e28a6e4b2e25453c6cfc90346876ac7240c6668',
  },
});

client.on('error', console.error);
client.on('warn', console.log);

console.log('Fetching toggles from: http://unleash.herokuapp.com');

setInterval(() => {
  const toggle = 'TestOperator';
  const context = {
    properties: {
      email: 'ivar@getunleash.ai',
      age: 37,
    },
  };
  const enabled = isEnabled(toggle, context);
  console.log(`${toggle}: ${enabled ? 'on' : 'off'}`);
}, 1000);
