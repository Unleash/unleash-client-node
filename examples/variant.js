const { Unleash } = require('../lib');

const client = new Unleash({
  appName: 'my-application',
  url: 'https://sandbox.getunleash.io/nuno/api/',
  customHeaders: {
    Authorization: '',
  },
  experimentalMode: { type: 'streaming' },
  skipInstanceCountWarning: true,
});
client.on('changed', () => {
  console.log('Enabled:', client.isEnabled('streaming-flag', { userId: `${Math.random()}` }));
});
