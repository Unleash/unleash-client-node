import test from 'ava';
import { EventEmitter } from 'events';
import nock from 'nock';

import Repository from '../lib/repository';

class MockStorage extends EventEmitter {
    constructor() {
        super();
        this.data = {};
        process.nextTick(() => this.emit('ready'));
    }

    reset (data) {
        this.data = data;
    }

    get (name) {
        return this.data[name];
    }
}


function setup (url, toggles, headers = {}) {
    return nock(url)
        .persist()
        .get('/features')
        .reply(200,  { features: toggles }, headers);
}


test('Repository should fetch from endpoint', (t) => new Promise((resolve) => {
    const url = 'http://unleash-test-0.app';   
    const feature = {
        name: 'feature',
        enabled: true,
        strategies: [{
            name: 'default'
        }],
    };
     
    setup(url, [feature]);
    const repo = new Repository('foo', `${url}/features`, 0, MockStorage);
    
    repo.once('data', () => {        
        const savedFeature = repo.storage.data[feature.name];
        t.true(savedFeature.enabled === feature.enabled);
        t.true(savedFeature.strategies[0].name === feature.strategies[0].name);

        const featureToggle = repo.getToggle('feature');
        t.truthy(featureToggle);

        resolve();
    })
}));

test('Repository should poll for changes', (t) => new Promise((resolve) => {
    const url = 'http://unleash-test-2.app';   
    setup(url, []);
    const repo = new Repository('foo', `${url}/features`, 100, MockStorage);
    
    let assertCount = 5;
    repo.on('data', () => {
        assertCount --;

        if (assertCount === 0) {
            repo.stop();
            resolve();
        }        
    });
}));

test('Repository should store etag', (t) => new Promise((resolve) => {
    const url = 'http://unleash-test-3.app';   
    setup(url, [], {'Etag': '12345'});
    const repo = new Repository('foo', `${url}/features`, 0, MockStorage);
    
    repo.once('data', () => {
        t.true(repo.etag === '12345');

        resolve();       
    });
}));


test.skip('Repository should request with etag', (t) => new Promise((resolve) => {
    const url = 'http://unleash-test-4.app';   
    nock(url, {
        reqheaders: {
            // TODO wip...
            'etag': console.log.bind(console, 'etag'),
            'If-None-Match': console.log.bind(console, 'If-None-Match'),
        }
    })
        .persist()
        .get('/features')
        .reply(200,  { features: [] });

    const repo = new Repository('foo', `${url}/features`, 0, MockStorage);
    
    // repo.etag = '12345-2'

    repo.once('data', () => {
        t.true(repo.etag === '12345');

        resolve();       
    });
}));


test('should handle 404 request error and emit error event', (t) => new Promise((resolve) => {
    const url = 'http://unleash-test-5.app';
    nock(url).persist().get('/features').reply(404, 'asd');

    const repo = new Repository('foo', `${url}/features`, 0, MockStorage);

    repo.on('error', (err) => {
        t.truthy(err);
        t.true(err.message.startsWith('Reponse was not statusCode 200'))
        resolve();
    });
    
}));

test('should handle 304 as silent ok', (t) => new Promise((resolve, reject) => {
    const url = 'http://unleash-test-6.app';
    nock(url).persist().get('/features').reply(304, '');

    const repo = new Repository('foo', `${url}/features`, 0, MockStorage);
    repo.on('error', reject);
    repo.on('data', reject);
    process.nextTick(resolve);
}));

test('should handle invalid JSON response', (t) => new Promise((resolve, reject) => {
    const url = 'http://unleash-test-7.app';
    nock(url).persist().get('/features').reply(200, '{"INvalid payload');
    const repo = new Repository('foo', `${url}/features`, 0, MockStorage);
    repo.on('error', (err) => {
        t.truthy(err);
        t.true(err.message.indexOf('Unexpected token') > -1);
        resolve();        
    });
    repo.on('data', reject);
}));


test('Repository emit errors on invalid features', (t) => new Promise((resolve) => {
    const url = 'http://unleash-test-1.app';   
    setup(url, [{
        name: 'feature',
        enabled: null,
        strategies: false,
    }]);
    const repo = new Repository('foo', `${url}/features`, 0, MockStorage);
    
    repo.once('error', (err) => {
        t.truthy(err);       
        resolve(); 
    });

}));