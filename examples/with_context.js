const { initialize, isEnabled } = require('../lib');

const client = initialize({
  appName: 'my-application',
  url: 'http://unleash.herokuapp.com/api/',
  refreshInterval: 10000,
  metricsInterval: 10000,
  environment: 'production',
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
