const { initialize, isEnabled } = require('../lib');

const client = initialize({
  appName: 'my-application',
  url: 'http://localhost:3000/api/',
  refreshInterval: 1000,
  customHeaders: {
    Authorization: '*:development.ba76487db29d7ef2557977a25b477c2e6288e2d9334fd1b91f63e2a9',
  }
});

client.on('error', console.error);
client.on('warn', console.log);
client.on('ready', () => {
  console.log('ready!')
});

console.log('Fetching toggles from: http://unleash.herokuapp.com');

setInterval(() => {
  console.log(`featureX enabled: ${isEnabled('featureX')}`);
}, 1000);