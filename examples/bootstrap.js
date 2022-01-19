const {
  initialize,
  getFeatureToggleDefinitions,
} = require('../lib');

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
    name: 'you',
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
  bootstrap: {
    data
  },
});

client.on('error', console.error);
client.on('warn', console.log);
client.on('changed', () => console.log('changed'));
client.on('unchanged', () => console.log('unchanged'));
client.on('synchronized', () => console.log('synchronized'));

client.on('ready', () => {
  console.log('ready')
  // console.log(getFeatureToggleDefinitions());
});

setInterval(() => {
  // console.log(client.getFeatureToggleDefinitions());
}, 1000)
