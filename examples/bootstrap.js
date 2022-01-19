/* eslint-disable */
const { initialize } = require('../lib');

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
  url: 'http://bogous-url:3000/proxy/',
  customHeaders: {
    Authorization: 'bootstrap',
  },

  bootstrap: {
   url: 'http://localhost:3000/proxy/client/features',
   urlHeaders: {
     Authorization: 'bootstrap',
   }
  },
});

client.on('error', () => console.log("\x1b[31m", 'Unable to fetch feature toggles', "\x1b[0m"));
client.on('warn', console.log);
// client.on('changed', () => console.log('changed'));
// client.on('unchanged', () => console.log('unchanged'));
client.on('synchronized', () => {
  console.log('synchronized')
  /*
  console.log(
    `Feature toggle 'demoApp.step1' is:`, 
    '\x1b[32m',`${client.isEnabled('demoApp.step1')}`,
    '\x1b[0m',
  );
  */
});
client.on('ready', () => console.log('ready'));


setInterval(() => {
  console.log(
    `Feature toggle 'demoApp.step1' is:`, 
    '\x1b[32m',`${client.isEnabled('demoApp.step1')}`,
    '\x1b[0m',
  );
}, 100)
