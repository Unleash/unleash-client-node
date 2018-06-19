import test from 'ava';
import nock from 'nock';
import { tmpdir } from 'os';
import { join } from 'path';
import mkdirp from 'mkdirp';
import specs from '@unleash/client-specification/specifications/index.json';

import { Unleash } from '../../lib/unleash';

let counter = 1;
const getUrl = () => `http://test2${counter++}.app/`;

function getRandomBackupPath() {
    const path = join(tmpdir(), `test-tmp-${Math.round(Math.random() * 100000)}`);
    mkdirp.sync(path);
    return path;
}

function mockNetwork(toggles, url = getUrl()) {
    nock(url)
        .get('/client/features')
        .reply(200, toggles);
    return url;
}

specs.forEach(testName => {
    const testCase = require(`@unleash/client-specification/specifications/${testName}`);
    testCase.tests.forEach(tc => {
        const url = mockNetwork(testCase.state);

        test(`${testName}:${tc.description}`, t =>
            new Promise((resolve, reject) => {
                const instance = new Unleash({
                    appName: 'foo',
                    disableMetrics: true,
                    url,
                    backupPath: getRandomBackupPath(),
                }).on('error', reject);

                instance.on('ready', () => {
                    const result = instance.isEnabled(tc.toggleName, tc.context);
                    t.is(result, tc.expectedResult);
                    instance.destroy();
                    resolve();
                });
            }));
    });
});
