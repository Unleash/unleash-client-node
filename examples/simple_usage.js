const { initialize, isEnabled } = require('../lib');

const data = [
  {
    enabled: true,
    name: 'bbbbbb',
    description: '',
    project: 'default',
    stale: false,
    type: 'experiment',
    variants: [],
    strategies: [],
  },
  {
    enabled: true,
    name: 'undefinedunleash-e2e-22',
    description: 'hellowrdada',
    project: 'default',
    stale: false,
    type: 'release',
    variants: [],
    strategies: [],
  },
  {
    enabled: false,
    name: 'fare',
    description: '',
    project: 'default',
    stale: false,
    type: 'release',
    variants: [],
    strategies: [],
  },
];

const client = initialize({
  appName: 'my-application',
  url: 'http://unleash.herokuapp.com/api/',
  customHeaders: {
    Authorization: '3bd74da5b341d868443134377ba5d802ea1e6fa2d2a948276ade1f092bec8d92',
  },
  bootstrap: data,
});

client.on('error', console.error);
client.on('warn', console.log);

//console.log('Fetching toggles from: http://unleash.herokuapp.com');

setInterval(() => {
  console.log(`featureX enabled: ${isEnabled('featureX')}`);
}, 1000);
