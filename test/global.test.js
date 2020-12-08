import test from 'ava';
import { tmpdir } from 'os';
import { join } from 'path';
import mkdirp from 'mkdirp';
const fetchMock = require('fetch-mock');
import 'isomorphic-fetch';

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
    const url = `http://unleash-${counter++}.app`;
    fetchMock.mock({
        url: `${url}/client/features`,
        response: {
            status: 200,
            body: JSON.stringify({ features: toggles }),
            headers: { 'content-type': 'application/json' },
        },
    });
    return url;
}

test('should be able to call api', t => {
    const url = mockNetwork();
    initialize({
        appName: 'foo',
        metricsInterval: 0,
        url,
        backupPath: getRandomBackupPath(),
    }).on('error', err => {
        throw err;
    });
    t.true(isEnabled('unknown') === false);
    destroy();
});

test.cb('should be able to call isEnabled eventually', t => {
    const url = mockNetwork();
    const instance = initialize({
        appName: 'foo',
        metricsInterval: 0,
        url,
        backupPath: getRandomBackupPath(),
    }).on('error', err => {
        throw err;
    });

    instance.on('ready', () => {
        t.true(isEnabled('feature') === true);
        t.end();
        destroy();
    });

    t.true(isEnabled('feature') === false);
});
