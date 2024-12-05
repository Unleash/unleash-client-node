const { Unleash } = require('../lib');

const client = new Unleash({
  appName: 'my-application',
  url: 'https://app.unleash-hosted.com/demo/api/',
  customHeaders: {
    Authorization: '943ca9171e2c884c545c5d82417a655fb77cec970cc3b78a8ff87f4406b495d0',
  },
  experimentalMode: { type: 'streaming' },
  skipInstanceCountWarning: true,
});
client.on('changed', () => {
  console.log(client.isEnabled('demo001', { userId: `${Math.random()}` }));
});
