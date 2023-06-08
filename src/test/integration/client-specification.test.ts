import test from 'ava';
import * as nock from 'nock';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirp } from 'mkdirp';
import * as specs from '@unleash/client-specification/specifications/index.json';

import { Unleash } from '../../unleash';

let counter = 1;
const getUrl = () => `http://client-spec-${counter++}.app/`;

// @ts-expect-error
function getRandomBackupPath(testName) {
  const path = join(tmpdir(), `test-${testName}-${Math.round(Math.random() * 100000)}`);
  mkdirp.sync(path);
  return path;
}

// @ts-expect-error
function mockNetwork(toggles, url = getUrl()) {
  nock(url).get('/client/features').reply(200, toggles);
  return url;
}

specs.forEach((testName) => {
  // eslint-disable-next-line
  const definition = require(`@unleash/client-specification/specifications/${testName}`);

  if (definition.tests) {
    // @ts-expect-error
    definition.tests.forEach((testCase) => {
      test(`${testName}:${testCase.description}`, (t) =>
        new Promise((resolve, reject) => {
          // Mock unleash-api
          const url = mockNetwork(definition.state);

          // New unleash instance
          const instance = new Unleash({
            appName: testName,
            disableMetrics: true,
            skipInstanceCountWarning: true,
            url,
            backupPath: getRandomBackupPath(definition.name),
          });

          instance.on('error', reject);
          instance.on('synchronized', () => {
            const result = instance.isEnabled(testCase.toggleName, testCase.context);
            t.is(result, testCase.expectedResult);
            instance.destroy();
            resolve();
          });
        }));
    });
  }

  if (definition.variantTests) {
    // @ts-expect-error
    definition.variantTests.forEach((testCase) => {
      test(`${testName}:${testCase.description}`, (t) =>
        new Promise((resolve, reject) => {
          // Mock unleash-api
          const url = mockNetwork(definition.state);

          // New unleash instance
          const instance = new Unleash({
            appName: testName,
            disableMetrics: true,
            skipInstanceCountWarning: true,
            url,
            backupPath: getRandomBackupPath(definition.name),
          });

          instance.on('error', reject);
          instance.on('synchronized', () => {
            const result = instance.getVariant(testCase.toggleName, testCase.context);
            t.deepEqual(result, testCase.expectedResult);

            instance.destroy();
            resolve();
          });
        }));
    });
  }
});
