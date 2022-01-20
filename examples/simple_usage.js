const { initialize } = require('../lib');

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

setInterval(() => {
  const context = { properties: {email: 'ivar@getunleash.ai'}};
  const toggleStatus = client.isEnabled('TestOperator', context);

  console.log(`TestOperator: ${toggleStatus ? 'on' : 'off'}`);
}, 1000);
