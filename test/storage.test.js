import test from 'ava';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as mkdirp from 'mkdirp';
import { Storage } from '../lib/storage';

function setup(name) {
  const tmp = join(tmpdir(), name + Math.round(10000 * Math.random()));
  mkdirp.sync(tmp);
  const storage = new Storage({ backupPath: tmp, appName: 'test' });

  storage.on('error', (err) => {
    throw err;
  });
  return storage;
}

test('should load content from backup file', (t) => new Promise((resolve, reject) => {
  const tmp = join(tmpdir(), 'backup-file-test');
  mkdirp.sync(tmp);
  const storage = new Storage({ backupPath: tmp, appName: 'test' });
  const data = { random: Math.random() };
  storage.on('error', reject);

  storage.once('persisted', () => {
    t.true(storage.get('random') === data.random);

    const storage2 = new Storage({ backupPath: tmp, appName: 'test' });
    storage2.on('error', reject);
    storage2.on('ready', () => {
      t.true(storage2.get('random') === data.random);
      resolve();
    });
  });
  storage.reset(data);
}));

test('should handle complex appNames', (t) => new Promise((resolve, reject) => {
  const tmp = join(tmpdir(), 'backup-file-test');
  mkdirp.sync(tmp);
  const appName = '@namspace-dash/slash-some-app';
  const storage = new Storage({ backupPath: tmp, appName });
  const data = { random: Math.random() };
  storage.on('error', reject);

  storage.once('persisted', () => {
    t.true(storage.get('random') === data.random);

    const storage2 = new Storage({ backupPath: tmp, appName });
    storage2.on('error', reject);
    storage2.on('ready', () => {
      t.true(storage2.get('random') === data.random);
      resolve();
    });
  });
  storage.reset(data);
}));

test.cb('should emit error when non-existent target backupPath', (t) => {
  const storage = new Storage({
    backupPath: join(tmpdir(), `random-${Math.round(Math.random() * 10000)}`),
    appName: 'test',
  });
  storage.reset({ random: Math.random() });
  storage.on('error', (err) => {
    t.truthy(err);
    t.true(err.code === 'ENOENT');
    t.end();
  });
});

test.cb('should emit error when stored data is invalid', (t) => {
  const dir = join(tmpdir(), `random-${Math.round(Math.random() * 10123000)}`);
  mkdirp.sync(dir);
  writeFileSync(join(dir, 'unleash-repo-schema-v1-test.json'), '{invalid: json, asd}', 'utf8');
  const storage = new Storage({
    backupPath: dir,
    appName: 'test',
  });
  storage.on('persisted', console.log);
  storage.on('error', (err) => {
    t.truthy(err);
    t.regex(err.message, /Unexpected token/);
    t.end();
  });
});

test('should not write content from backup file if ready has been fired',
  (t) => new Promise((resolve, reject) => {
    const tmp = join(tmpdir(), 'ignore-backup-file-test');
    mkdirp.sync(tmp);
    const storage = new Storage({
      backupPath: tmp,
      appName: 'test',
    });
    const data = { random: Math.random() };
    storage.on('error', reject);

    storage.once('persisted', () => {
      t.true(storage.get('random') === data.random);

      const storage2 = new Storage({
        backupPath: tmp,
        appName: 'test',
      });
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

test('should provide Get method from data', (t) => {
  const storage = setup('get-method');
  const result = storage.get('some-key');

  t.true(result === undefined);

  storage.reset({ 'some-key': 'some-value' });

  const result2 = storage.get('some-key');

  t.true(result2 === 'some-value');
});

test('should provide getAll method for data object', (t) => {
  const storage = setup('get-all-method');
  const result = storage.getAll();

  t.deepEqual(result, {});

  storage.reset({ 'some-key': 'some-value' });

  const result2 = storage.getAll();

  t.deepEqual(result2, { 'some-key': 'some-value' });
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
