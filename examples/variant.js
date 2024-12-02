const { initialize, isEnabled } = require('../lib');

const client = initialize({
  appName: 'my-application',
  url: 'http://localhost:4242/api/',
  customHeaders: {
    Authorization: '*:development.35a4fe08c112c8d98cc7a21bdf4d077796920c5e86b0f98eed467b23',
  },
  streaming: true,
});

client.on('error', console.error);
client.on('warn', console.log);

console.log('Fetching toggles from: http://unleash.herokuapp.com');

setInterval(() => {
  console.log('Enabled:', isEnabled('sadfsdaf', { userId: `${Math.random()}` }));
}, 1000);
