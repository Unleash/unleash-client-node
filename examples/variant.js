const { initialize, getVariant, isEnabled } = require('../lib');

const client = initialize({
  appName: 'my-application',
  url: 'http://localhost:4242/api/',
  customHeaders: {
    Authorization: 'default:development.dd92846f01b00d01923a14afc240d3d4923399b14fdbbec6eb8bd31d',
  },
  refreshInterval: 1000
});

client.on('error', console.error);
client.on('warn', console.log);

// console.log('Fetching toggles from: http://unleash.herokuapp.com');

setInterval(() => {
  const user = `${Math.random()}`;
  // console.log('Is Enabled', client.isEnabled('StrategyVariantDemo', { userId: user }));
  console.log('Variant config', client.getVariant('sadfdsafadsf', {plan: 'Pro'}));
}, 1000);
