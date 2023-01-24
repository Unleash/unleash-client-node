const fs = require('fs');

const newUnleashVersion = process.argv[2];

const name = 'unleash-client-node';

const details = {
  name,
  version: newUnleashVersion,
  sdkVersion: `${name}:${newUnleashVersion}`,
};
fs.writeFileSync('./src/details.json', JSON.stringify(details));
