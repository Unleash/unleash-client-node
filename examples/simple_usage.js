const { UnleashMetricClient } = require('../lib');

const url = 'http://localhost:4242/api/';
const apiToken = '*:development.a80d09556cf83ef8f53b031d2bd941a3646da384c3976a4cd9991cc5';
const toggleName = 'testflag';
const unleashContext = { userId: '1232' };

const unleash = new UnleashMetricClient({
  appName: 'my-application',
  url,
  refreshInterval: 1000,
  metricsInterval: 1000,
  customHeaders: {
    Authorization: apiToken,
  },
});

unleash.on('error', console.error);
unleash.on('warn', console.log);
unleash.on('ready', () => {
  console.log('ready!');
});

unleash.impactMetrics.defineCounter('test', 'some-help-text');

console.log(`Fetching toggles from: ${url}`);

setInterval(() => {
  unleash.impactMetrics.incrementCounter('test');
  const enabled = unleash.isEnabled(toggleName, unleashContext);
  console.log(`Enabled: ${enabled}`);
}, 1000);
