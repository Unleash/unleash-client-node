import test from 'ava';
const fetchMock = require('fetch-mock');
import { tmpdir } from 'os';
import { join } from 'path';
import mkdirp from 'mkdirp';
import specs from '@unleash/client-specification/specifications/index.json';
import 'isomorphic-fetch';

import { Unleash } from '../../lib/unleash';

let counter = 1;
const getUrl = () => `http://client-spec-${counter++}.app`;

function getRandomBackupPath(testName) {
    const path = join(tmpdir(), `test-${testName}-${Math.round(Math.random() * 100000)}`);
    mkdirp.sync(path);
    return path;
}

function mockNetwork(toggles, url = getUrl()) {
    fetchMock.mock({
        url: `${url}/client/features`,
        response: {
            status: 200,
            body: JSON.stringify(toggles),
        },
    });

    return url;
}

specs.forEach(testName => {
    const definition = require(`@unleash/client-specification/specifications/${testName}`);

    if (definition.tests) {
        definition.tests.forEach(testCase => {
            test(`${testName}:${testCase.description}`, t =>
                new Promise((resolve, reject) => {
                    // Mock unleash-api
                    const url = mockNetwork(definition.state);

                    // New unleash instance
                    const instance = new Unleash({
                        appName: testName,
                        disableMetrics: true,
                        url,
                        backupPath: getRandomBackupPath(definition.name),
                        instanceId: '1',
                    });

                    instance.on('error', reject);
                    instance.on('ready', () => {
                        const result = instance.isEnabled(testCase.toggleName, testCase.context);
                        t.is(result, testCase.expectedResult);
                        instance.destroy();
                        resolve();
                    });
                }));
        });
    }

    if (definition.variantTests) {
        definition.variantTests.forEach(testCase => {
            test(`${testName}:${testCase.description}`, t =>
                new Promise((resolve, reject) => {
                    // Mock unleash-api
                    const url = mockNetwork(definition.state);

                    // New unleash instance
                    const instance = new Unleash({
                        appName: testName,
                        disableMetrics: true,
                        url,
                        backupPath: getRandomBackupPath(definition.name),
                        instanceId: '1',
                    });

                    instance.on('error', reject);
                    instance.on('ready', () => {
                        const result = instance.getVariant(testCase.toggleName, testCase.context);
                        t.deepEqual(result, testCase.expectedResult);

                        instance.destroy();
                        resolve();
                    });
                }));
        });
    }
});
