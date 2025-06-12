const { initialize, isEnabled } = require('../lib');

const url = 'https://sandbox.getunleash.io/enterprise/api';
const apiToken = '*';
const toggleName = 'demo001';
const unleashContext = { userId: '1232' };

const unleash = initialize({
  appName: 'my-application',
  url,
  refreshInterval: 1000,
  counterInterval: 10000,
  customHeaders: {
    Authorization: apiToken,
  },
});

unleash.customMetrics.count('unleash_deployed', {});

unleash.on('error', console.error);
unleash.on('warn', console.log);
unleash.on('ready', () => {
  console.log('ready!');
});

console.log(`Fetching toggles from: ${url}`);

setInterval(() => {
  const enabled = isEnabled(toggleName, unleashContext);
  console.log(`Enabled: ${enabled}`);
  unleash.customMetrics.count('feature_liked', {
    feature: toggleName,
    enabled: enabled,
  });
  unleash.customMetrics.count(
    'feature_evaluation_time',
    {
      feature: toggleName,
    },
    Math.floor(Math.random() * (1000 - 500 + 1)) + 500,
  );
  unleash.customMetrics.count('feature_evaluation_count', {
    feature: toggleName,
  });
}, 1000);
