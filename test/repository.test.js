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
    const url = 'http://unleash-test-1.app';   
    const feature = {
        name: 'featureF',
        enabled: true,
        strategies: [{
            name: 'default'
        }],
    };
     
    setup(url, [feature]);
    const repo = new Repository('foo', `${url}/features`, 10000, MockStorage);
    
    repo.once('data', () => {        
        repo.stop();
        const savedFeature = repo.storage.data[feature.name];
        t.true(savedFeature.enabled === feature.enabled);
        t.true(savedFeature.strategies[0].name === feature.strategies[0].name);
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
    const repo = new Repository('foo', `${url}/features`, 1000, MockStorage);
    
    repo.once('data', () => {
        t.true(repo.etag === '12345');

        resolve();       
    });
}));

test('Repository should request with etag', (t) => new Promise((resolve) => {
    const url = 'http://unleash-test-3.app';   
    nock(url, {
        reqheaders: {
            // TODO wip
            'etag': console.log.bind(console, 'etag'),
            'If-None-Match': console.log.bind(console, 'If-None-Match'),
        }
    })
        .persist()
        .get('/features')
        .reply(200,  { features: [] });

    const repo = new Repository('foo', `${url}/features`, 1000, MockStorage);
    
    // repo.etag = '12345-2'

    repo.once('data', () => {
        t.true(repo.etag === '12345');

        resolve();       
    });
}));