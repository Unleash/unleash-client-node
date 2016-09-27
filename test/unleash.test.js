import test from 'ava';
import nock from 'nock';
import { tmpdir } from 'os';
import { join } from 'path';
import mkdirp from 'mkdirp';

import { Unleash } from '../lib/unleash';

function getRandomBackupPath () {
    const path = join(tmpdir(), `test-tmp-${Math.round(Math.random() * 100000)}`);
    mkdirp.sync(path);
    return path;
}

const defaultToggles = [
    {
        name: 'feature',
        enabled: true,
        strategy: 'default',
    },
];
function mockNetwork (toggles = defaultToggles) {
    nock('http://unleash.app')
        // .persist()
        .get('/features')
        .reply(200,  { features: toggles });
}

test('should error when missing url', (t) => {
    t.throws(() => new Unleash({}));
    t.throws(() => new Unleash({ url: false }));
});

test.cb('repository should surface error when invalid basePAth', (t) => {
    mockNetwork();
    const backupPath = join(tmpdir(), `test-tmp-${Math.round(Math.random() * 100000)}`);
    const instance = new Unleash({
        url: 'http://unleash.app/features',
        backupPath,
        errorHandler (e) {
            throw e;
        },
    });

    instance.on('error', (err) => {
        t.truthy(err);
        t.true(err.code === 'ENOENT');
        t.end();
    });
});


test('should allow request even before unleash is initialized', (t) => {
    mockNetwork();
    const instance = new Unleash({
        url: 'http://unleash.app/features',
        backupPath: getRandomBackupPath(),
        errorHandler (e) {
            throw e;
        },
    });
    t.true(instance.isEnabled('unknown') === false);
    instance.destroy();
});

test('should consider known feature-toggle as active', (t) => new Promise((resolve, reject) => {
    mockNetwork();
    const instance = new Unleash({
        url: 'http://unleash.app/features',
        backupPath: getRandomBackupPath(),
        errorHandler (e) {
            reject(e);
        },
    });

    instance.on('ready', () => {
        t.true(instance.isEnabled('feature') === true);
        instance.destroy();
        resolve();
    });
}));

test('should consider unknown feature-toggle as disabled', (t) => new Promise((resolve, reject) => {
    mockNetwork();
    const instance = new Unleash({
        url: 'http://unleash.app/features',
        backupPath: getRandomBackupPath(),
        errorHandler (e) {
            reject(e);
        },
    });

    instance.on('ready', () => {
        t.true(instance.isEnabled('unknown') === false);
        instance.destroy();
        resolve();
    });
}));


test('should return fallbackvalue until online', (t) => new Promise((resolve, reject) => {
    mockNetwork();
    const instance = new Unleash({
        url: 'http://unleash.app/features',
        backupPath: getRandomBackupPath(),
        errorHandler (e) {
            reject(e);
        },
    });

    let warnCounter = 0;
    instance.on('warn', () => {
        warnCounter++;
    });

    t.true(instance.isEnabled('feature') === false);
    t.true(warnCounter === 1);
    t.true(instance.isEnabled('feature', {}, false) === false);
    t.true(instance.isEnabled('feature', {}, true) === true);
    t.true(warnCounter === 3);

    instance.on('ready', () => {
        t.true(instance.isEnabled('feature') === true);
        t.true(instance.isEnabled('feature', {}, false) === true);
        instance.destroy();
        resolve();
    });
}));
