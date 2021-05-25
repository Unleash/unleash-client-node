const { initialize } = require('../lib');

const client = initialize({
  appName: 'test-all-toggles',
  url: 'https://unleash.herokuapp.com/api',
  metricsInterval: 1000,
  refreshInterval: 5000,
  customHeaders: {
    Authorization: '3bd74da5b341d868443134377ba5d802ea1e6fa2d2a948276ade1f092bec8d92',
  },
});

client.on('error', console.error);
client.on('warn', console.log);
client.on('unchanged', () => console.error('NOT CHANGED'));
client.on('changed', () => console.log('changed'));

console.log('Fetching toggles from: https://unleash.herokuapp.com');

const toggle = 'Demo';

setInterval(() => {
  const enabled = client.isEnabled(toggle, { userId: `${Math.random() * 10000}` });
  console.log(`${toggle}: ${enabled}`);
}, 100);
