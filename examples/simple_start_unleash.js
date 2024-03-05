const { startUnleash } = require('../lib');

const main = async () => {
  const unleash = await startUnleash({
    appName: 'async-unleash',
    url: 'http://unleash.herokuapp.com/api/',
  });
  const enabled = unleash.isEnabled('Demo');
  console.log(`Demo is ${enabled}`);
};

main();
