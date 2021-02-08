const fs = require('fs');

const { version } = require('../package.json');

const name = 'unleash-client-node';

const details = {
  name,
  version,
  sdkVersion: `${name}:${version}`,
};

fs.writeFileSync('./src/details.json', JSON.stringify(details));
