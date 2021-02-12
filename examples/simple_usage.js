const { initialize, isEnabled } = require('../lib');

const client = initialize({
  appName: 'my-application',
  url: 'http://unleash.herokuapp.com/api/',
});

client.on('error', console.error);
client.on('warn', console.log);

console.log('Fetching toggles from: http://unleash.herokuapp.com');

setInterval(() => {
  console.log(`featureX enabled: ${isEnabled('featureX')}`);
}, 1000);
