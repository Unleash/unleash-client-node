const { isEnabled, run, initialize } = require('../lib');

const url = 'http://localhost:4242/api';
const apiToken = '*:development.f374c0278e4601ee9f15f96bd7d36380cf8b1f603029fb3ba7b9105d';
const unleashContext = { userId: '1232' };

const unleash = initialize({
  appName: 'my-application',
  url,
  metricsInterval: 3000,
  refreshInterval: 1000,
  customHeaders: {
    Authorization: apiToken,
  },
});

unleash.on('error', console.error);
unleash.on('warn', console.log);
unleash.on('ready', () => {
  console.log('ready!');
});

console.log(`Fetching toggles from: ${url}`);

setInterval(() => {
  const iterations = Math.round(Math.random() * 1_000_000);

  run({
    toggleName: 'default',
    onEnabled: () => {
      if (Math.random() > 0.7) {
        throw new Error('Whoopsie!');
      }

      Array.from(Array(iterations)).reduce((total, n) => {
        return total + `${n}`;
      });
    },
    onDisabled: () => {
      if (Math.random() > 0.8) {
        throw new Error('Whoopsie!');
      }
      Array.from(Array(Math.round(iterations / 2))).reduce((total, n) => {
        return total + `${n}`;
      });
    },
  });
}, 100);
