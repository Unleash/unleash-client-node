const { initialize, getVariant } = require('../lib');

const client = initialize({
  appName: 'my-application',
  url: 'https://unleash.herokuapp.com/api/',
  customHeaders: {
    Authorization: '3bd74da5b341d868443134377ba5d802ea1e6fa2d2a948276ade1f092bec8d92',
  },
});

client.on('error', console.error);
client.on('warn', console.log);

console.log('Fetching toggles from: http://unleash.herokuapp.com');

setInterval(() => {
  console.log('Variant config', getVariant('Test.variants', { userId: `${Math.random()}` }));
}, 1000);
