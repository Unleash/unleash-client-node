import test from 'ava';
import { EventEmitter } from 'events';
import nock from 'nock';

import Repository from '../lib/repository';

const appName = 'foo';
const instanceId = 'bar';

class MockStorage extends EventEmitter {
    constructor() {
        super();
        this.data = {};
        process.nextTick(() => this.emit('ready'));
    }

    reset(data) {
        this.data = data;
    }

    get(name) {
        return this.data[name];
    }
}

function setup(url, toggles, headers = {}) {
    return nock(url)
        .persist()
        .get('/client/features')
        .reply(200, { features: toggles }, headers);
}

test.cb('should fetch from endpoint', t => {
    const url = 'http://unleash-test-0.app';
    const feature = {
        name: 'feature',
        enabled: true,
        strategies: [
            {
                name: 'default',
            },
        ],
    };

    setup(url, [feature]);
    const repo = new Repository({
        backupPath: 'foo',
        url,
        appName,
        instanceId,
        refreshInterval: 0,
        StorageImpl: MockStorage,
    });

    repo.once('data', () => {
        const savedFeature = repo.storage.data[feature.name];
        t.true(savedFeature.enabled === feature.enabled);
        t.true(savedFeature.strategies[0].name === feature.strategies[0].name);

        const featureToggle = repo.getToggle('feature');
        t.truthy(featureToggle);
        t.end();
    });
});

test('should poll for changes', t =>
    new Promise((resolve, reject) => {
        const url = 'http://unleash-test-2.app';
        setup(url, []);
        const repo = new Repository({
            backupPath: 'foo-bar',
            url,
            appName,
            instanceId,
            refreshInterval: 10,
            StorageImpl: MockStorage,
        });

        let assertCount = 5;
        repo.on('data', () => {
            assertCount--;

            if (assertCount === 0) {
                repo.stop();
                t.true(assertCount === 0);
                resolve();
            }
        });

        repo.on('error', reject);
    }));

test('should store etag', t =>
    new Promise(resolve => {
        const url = 'http://unleash-test-3.app';
        setup(url, [], { Etag: '12345' });
        const repo = new Repository({
            backupPath: 'foo',
            url,
            appName,
            instanceId,
            refreshInterval: 0,
            StorageImpl: MockStorage,
        });

        repo.once('data', () => {
            t.true(repo.etag === '12345');

            resolve();
        });
    }));

test.cb('should request with etag', t => {
    const url = 'http://unleash-test-4.app';
    nock(url)
        .matchHeader('If-None-Match', value => value === '12345-1')
        .persist()
        .get('/client/features')
        .reply(200, { features: [] }, { Etag: '12345-2' });

    const repo = new Repository({
        backupPath: 'foo',
        url,
        appName,
        instanceId,
        refreshInterval: 0,
        StorageImpl: MockStorage,
    });

    repo.etag = '12345-1';

    repo.once('data', () => {
        t.true(repo.etag === '12345-2');
        t.end();
    });
});

test.cb('should request with custom headers', t => {
    const url = 'http://unleash-test-4-x.app';
    const randomKey = `random-${Math.random()}`;
    nock(url)
        .matchHeader('randomKey', value => value === randomKey)
        .persist()
        .get('/client/features')
        .reply(200, { features: [] }, { Etag: '12345-3' });

    const repo = new Repository({
        backupPath: 'foo',
        url,
        appName,
        instanceId,
        refreshInterval: 0,
        StorageImpl: MockStorage,
        headers: {
            randomKey,
        },
    });

    repo.etag = '12345-1';

    repo.once('data', () => {
        t.true(repo.etag === '12345-3');
        t.end();
    });
});

test.cb('should handle 404 request error and emit error event', t => {
    const url = 'http://unleash-test-5.app';
    nock(url)
        .persist()
        .get('/client/features')
        .reply(404, 'asd');

    const repo = new Repository({
        backupPath: 'foo',
        url,
        appName,
        instanceId,
        refreshInterval: 0,
        StorageImpl: MockStorage,
    });

    repo.on('error', err => {
        t.truthy(err);
        t.true(err.message.startsWith('Response was not statusCode 2'));
        t.end();
    });
});

test('should handle 304 as silent ok', t => {
    t.plan(0);

    return new Promise((resolve, reject) => {
        const url = 'http://unleash-test-6.app';
        nock(url)
            .persist()
            .get('/client/features')
            .reply(304, '');

        const repo = new Repository({
            backupPath: 'foo',
            url,
            appName,
            instanceId,
            refreshInterval: 0,
            StorageImpl: MockStorage,
        });
        repo.on('error', reject);
        repo.on('data', reject);
        process.nextTick(resolve);
    });
});

test('should handle invalid JSON response', t =>
    new Promise((resolve, reject) => {
        const url = 'http://unleash-test-7.app';
        nock(url)
            .persist()
            .get('/client/features')
            .reply(200, '{"Invalid payload');

        const repo = new Repository({
            backupPath: 'foo',
            url,
            appName,
            instanceId,
            refreshInterval: 0,
            StorageImpl: MockStorage,
        });
        repo.on('error', err => {
            t.truthy(err);
            t.true(
                err.message.indexOf('Unexpected token') > -1 ||
                    err.message.indexOf('Unexpected end of JSON input') > -1
            );
            resolve();
        });
        repo.on('data', reject);
    }));

test.cb('should emit errors on invalid features', t => {
    const url = 'http://unleash-test-1.app';
    setup(url, [
        {
            name: 'feature',
            enabled: null,
            strategies: false,
        },
    ]);
    const repo = new Repository({
        backupPath: 'foo',
        url,
        appName,
        instanceId,
        refreshInterval: 0,
        StorageImpl: MockStorage,
    });

    repo.once('error', err => {
        t.truthy(err);
        t.end();
    });
});
