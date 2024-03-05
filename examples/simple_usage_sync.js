const { initialize } = require('../lib');

const url = 'http://localhost:4242/api/';
const apiToken = '*:development.e45bc2844592103afb60cfa90f039c487395e88d7751cf59c2a99329';
const toggleName = 'demo6';
const unleashContext = {};

const unleash = initialize({
  appName: 'my-application',
  url,
  customHeaders: {
    Authorization: apiToken,
  },
});

unleash.on('error', console.warn);
unleash.on('warn', console.warn);
unleash.on('ready', () => console.log('ready!'));

console.log(`Fetching toggles from: ${url}`);

unleash.on('synchronized', () => {
  for (let i = 0; i < 100; i++) {
    const v = unleash.isEnabled(toggleName, unleashContext);
    console.log(v);
  }
  unleash.destroyWithFlush();
});
