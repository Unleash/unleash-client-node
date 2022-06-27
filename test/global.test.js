import test from 'ava';
import nock from 'nock';
import { tmpdir } from 'os';
import { join } from 'path';
import mkdirp from 'mkdirp';

import { initialize, isEnabled, destroy } from '../lib/index';

function getRandomBackupPath() {
  const path = join(tmpdir(), `test-tmp-${Math.round(Math.random() * 100000)}`);
  mkdirp.sync(path);
  return path;
}

const defaultToggles = [
  {
    name: 'feature',
    enabled: true,
    strategies: [],
  },
];

let counter = 0;
function mockNetwork(toggles = defaultToggles) {
  counter += 1;
  const url = `http://unleash-${counter}.app`;
  nock(url)
    .get('/client/features')
    .reply(200, { features: toggles });
  return url;
}

test('should be able to call api', (t) => {
  const url = mockNetwork();
  initialize({
    appName: 'foo',
    metricsInterval: 0,
    url,
    backupPath: getRandomBackupPath(),
  }).on('error', (err) => {
    throw err;
  });
  t.true(isEnabled('unknown') === false);
  destroy();
});

test.cb('should be able to call isEnabled eventually', (t) => {
  const url = mockNetwork();
  const instance = initialize({
    appName: 'foo',
    metricsInterval: 0,
    url,
    backupPath: getRandomBackupPath(),
  }).on('error', (err) => {
    throw err;
  });

  instance.on('synchronized', () => {
    t.true(isEnabled('feature') === true);
    t.end();
    destroy();
  });

  t.true(isEnabled('feature') === false);
});

test.cb('should return fallbackValue if init was not called', (t) => {
  t.true(isEnabled('feature') === false);
  t.true(isEnabled('feature', {}, false) === false);
  t.true(isEnabled('feature', {}, true) === true);
  t.end();
})
