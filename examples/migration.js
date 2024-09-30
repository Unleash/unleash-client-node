const { initialize, migrateFlag } = require('../lib');

const client = initialize({
  appName: 'migration-application',
  url: 'https://sandbox.getunleash.io/enterprise/api/',
  refreshInterval: 3000,
  metricsInterval: 3000,
  environment: 'production',
  customHeaders: {
    Authorization: 'migration:development.924579bdb2542b96b8c00d3a22f2345c95b521e6b3717ad57ff8d43b',
  },
});
client.on('error', console.error);
client.on('warn', console.log);

const homebrewFlagProvider = (_flag) => true || _flag; // mock

setInterval(async () => {
  const context = {
    userId: `${Math.random() * 100}`,
    sessionId: Math.round(Math.random() * 1000),
    remoteAddress: '127.0.0.1',
  };
  const toggleName = 'initiative';
  const value = await migrateFlag(toggleName, homebrewFlagProvider, context);
  console.log(`${toggleName} enabled: ${value}`);
}, 1000);
