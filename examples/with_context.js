const { initialize, isEnabled } = require('../lib');

const client = initialize({
  appName: 'my-application',
  url: 'http://unleash.herokuapp.com/api/',
  refreshInterval: 10000,
  metricsInterval: 10000,
  environment: 'production',
  customHeaders: {
    Authorization: '3bd74da5b341d868443134377ba5d802ea1e6fa2d2a948276ade1f092bec8d92',
  },
});

client.on('error', console.error);
client.on('warn', console.log);

console.log('Fetching toggles from: http://unleash.herokuapp.com');

setInterval(() => {
  const context = {
    userId: `${Math.random() * 100}`,
    sessionId: Math.round(Math.random() * 1000),
    remoteAddress: '127.0.0.1',
  };
  const toggleName = 'app.demo';
  console.log(`${toggleName} enabled: ${isEnabled(toggleName, context)}`);
}, 1000);
