const { Unleash } = require('../lib');
const { setInterval } = require('node:timers');

const client = new Unleash({
  appName: 'my-application',
  url: 'https://sandbox.getunleash.io/enterprise/api/',
  customHeaders: {
    Authorization: 'deltasbug:development.9814ecf06dc4fb69433b45187cb9c305b2886ed74b6261498aa2ee78',
  },
  experimentalMode: { type: 'polling', format: 'delta' },
  skipInstanceCountWarning: true,
  refreshInterval: 2000,
});
client.on('changed', () => {
  console.log('deltaChanged', client.isEnabled('child_delta', { userId: `${Math.random()}` }));
});
setInterval(() => {}, 1000);
