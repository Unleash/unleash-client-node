import test from 'ava';
import { tmpdir } from 'os';
import { join } from 'path';
import { Storage } from '../lib/storage';
import * as mkdirp from 'mkdirp';

function setup (name) {
    const tmp = join(tmpdir(), name + Math.round(10000 * Math.random()));
    mkdirp.sync(tmp);
    const storage = new Storage(tmp);

    storage.on('error', (err) => {
        throw err;
    });
    return storage;
}

test('Storage should load content from backupfile', (t) => new Promise((resolve, reject) => {
    const tmp = join(tmpdir(), 'backup-file-test');
    mkdirp.sync(tmp);
    const storage = new Storage(tmp);
    const data = { random: Math.random() };
    storage.on('error', reject);

    storage.once('persisted', () => {
        t.true(storage.get('random') === data.random);

        const storage2 = new Storage(tmp);
        storage2.on('error', reject);
        storage2.on('ready', () => {
            t.true(storage2.get('random') === data.random);
            resolve();
        });
    });
    storage.reset(data);
}));


test('Storage should not write content from backupfile if ready has been fired', (t) => new Promise((resolve, reject) => {
    const tmp = join(tmpdir(), 'ignore-backup-file-test');
    mkdirp.sync(tmp);
    const storage = new Storage(tmp);
    const data = { random: Math.random() };
    storage.on('error', reject);

    storage.once('persisted', () => {
        t.true(storage.get('random') === data.random);

        const storage2 = new Storage(tmp);
        const overwrite = { random: Math.random() };
        
        storage2.on('error', reject);
        storage2.on('ready', () => {
            t.true(storage2.get('random') !== data.random);
            t.true(storage2.get('random') === overwrite.random);
            resolve();
        });

        // Lets pretend "server" finished read first
        storage2.reset(overwrite);
    });
    storage.reset(data);
}));

test('Storage should provide Get method from data', (t) => {

    const storage = setup('get-method');
    const result = storage.get('some-key');
    
    t.true(result === undefined);

    storage.reset({'some-key': 'some-value'});

    const result2 = storage.get('some-key');
    
    t.true(result2 === 'some-value');
});

test('should persist data on reset', (t) => new Promise((resolve) => {
    const storage = setup('persist');
    const data = { random: Math.random() };

    storage.once('persisted', () => {
        t.true(storage.get('random') === data.random);
        resolve();
    });

    t.true(storage.get('random') !== data.random);
    storage.reset(data);
    t.true(storage.get('random') === data.random);
}));

test('should persist again after data reset', (t) => new Promise((resolve) => {
    const storage = setup('persist2');
    const data = { random: Math.random() };

    storage.once('persisted', () => {
        t.true(storage.get('random') === data.random);
        const data2 = { random: Math.random() };

        storage.once('persisted', () => {
            t.true(storage.get('random') === data2.random);
            resolve();
        });

        storage.reset(data2);
    });

    t.true(storage.get('random') !== data.random);
    storage.reset(data);
    t.true(storage.get('random') === data.random);
}));