const { isEnabledWithTimer, isEnabled, run, initialize } = require('../lib');

const url = 'http://localhost:4242/api';
const apiToken = '*:development.f374c0278e4601ee9f15f96bd7d36380cf8b1f603029fb3ba7b9105d';
const unleashContext = { userId: '1232' };

const unleash = initialize({
  appName: 'my-application',
  url,
  metricsInterval: 3000,
  refreshInterval: 60000,
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

  const doSomething = (iterations, errorRate) => {
    if (Math.random() > 1 - errorRate) {
      throw new Error('Whoopsie!');
    }

    Array.from(Array(iterations)).reduce((total, n) => {
      return total + `${n}`;
    });
  };

  // run in a closure tracked by unleash
  try {
    run({
      toggleName: 'default',
      onEnabled: () => {
        doSomething(iterations, 0.3);
      },
      onDisabled: () => {
        doSomething(Math.round(iterations / 2), 0.2);
      },
    });
  } catch {
    // ignore
  }

  // return a timer, and stop it yourself
  const { stopTimer, isEnabled } = isEnabledWithTimer('default');
  if (isEnabled) {
    doSomething(iterations, 0);
  }
  stopTimer();
  //
}, 100);
