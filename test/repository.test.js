import test from 'ava';
import nock from 'nock';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import InMemStorageProvider from '../lib/repository/storage-provider-in-mem';
import FileStorageProvider from '../lib/repository/storage-provider-file';
import Repository from '../lib/repository';
import { DefaultBootstrapProvider } from '../lib/repository/bootstrap-provider';


const appName = 'foo';
const instanceId = 'bar';

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
    url,
    appName,
    instanceId,
    refreshInterval: 1000,
    bootstrapProvider: new DefaultBootstrapProvider({}),
    storageProvider: new InMemStorageProvider(),
  });

  repo.once('changed', () => {
    const savedFeature = repo.getToggle(feature.name);
    t.is(savedFeature.enabled, feature.enabled);
    t.is(savedFeature.strategies[0].name, feature.strategies[0].name);

    const featureToggles = repo.getToggles();
    t.is(featureToggles[0].name, 'feature');

    t.end();
  });
  repo.start();
});

test('should poll for changes', t =>
  new Promise((resolve, reject) => {
    const url = 'http://unleash-test-2.app';
    setup(url, []);
    const repo = new Repository({
      url,
      appName,
      instanceId,
      refreshInterval: 10,
      bootstrapProvider: new DefaultBootstrapProvider({}),
      storageProvider: new InMemStorageProvider(),
    });

    let assertCount = 5;
    repo.on('unchanged', resolve);
    repo.on('changed', () => {
      assertCount--;

      if (assertCount === 0) {
        repo.stop();
        t.true(assertCount === 0);
        resolve();
      }
    });

    repo.on('error', reject);
    repo.start();
  }));

test('should retry even if custom header function fails', t =>
  new Promise(resolve => {
    const url = 'http://unleash-test-2-custom-headers.app';
    setup(url, []);
    const repo = new Repository({
      backupPath: 'foo-bar',
      url,
      appName,
      instanceId,
      refreshInterval: 10,
      customHeadersFunction: () => {
        throw new Error('custom function fails');
      },
      bootstrapProvider: new DefaultBootstrapProvider({}),
      storageProvider: new InMemStorageProvider(),
    });

    let assertCount = 2;
    repo.on('error', error => {
      if (error.message === 'custom function fails') {
        assertCount--;
      }
      if (assertCount === 0) {
        repo.stop();
        t.true(assertCount === 0);
        resolve();
      }
    });
    repo.start();
  }));

test('should store etag', t =>
  new Promise(resolve => {
    const url = 'http://unleash-test-3.app';
    setup(url, [], { Etag: '12345' });
    const repo = new Repository({
      url,
      appName,
      instanceId,
      refreshInterval: 1000,
      bootstrapProvider: new DefaultBootstrapProvider({}),
      storageProvider: new InMemStorageProvider(),
    });

    repo.once('unchanged', resolve);
    repo.once('changed', () => {
      t.true(repo.etag === '12345');

      resolve();
    });
    repo.start();
  }));

test.cb('should request with etag', t => {
  const url = 'http://unleash-test-4.app';
  nock(url)
    .matchHeader('If-None-Match', '12345-1')
    .persist()
    .get('/client/features')
    .reply(200, { features: [] }, { Etag: '12345-2' });

  const repo = new Repository({
    url,
    appName,
    instanceId,
    refreshInterval: 1000,
    bootstrapProvider: new DefaultBootstrapProvider({}),
    storageProvider: new InMemStorageProvider(),
  });

  repo.etag = '12345-1';
  repo.once('unchanged', () => {
    t.end();
  });
  repo.once('changed', () => {
    t.true(repo.etag === '12345-2');
    t.end();
  });
  repo.start();
});

test.cb('should request with custom headers', t => {
  const url = 'http://unleash-test-4-x.app';
  const randomKey = `random-${Math.random()}`;
  nock(url)
    .matchHeader('randomKey', randomKey)
    .persist()
    .get('/client/features')
    .reply(200, { features: [] }, { Etag: '12345-3' });

  const repo = new Repository({
    url,
    appName,
    instanceId,
    refreshInterval: 1000,
    bootstrapProvider: new DefaultBootstrapProvider({}),
    storageProvider: new InMemStorageProvider(),
    headers: {
      randomKey,
    },
  });

  repo.etag = '12345-1';
  repo.once('unchanged', () => {
    t.end();
  });
  repo.once('changed', () => {
    t.is(repo.etag, '12345-3');
    t.end();
  });
  repo.start();
});

test.cb('request with customHeadersFunction should take precedence over customHeaders', t => {
  const url = 'http://unleash-test-4-x.app';
  const randomKey = `random-${Math.random()}`;
  const customHeaderKey = `customer-${Math.random()}`;
  nock(url)
    .matchHeader('customHeaderKey', customHeaderKey)
    .matchHeader('randomKey', value => value === undefined)
    .persist()
    .get('/client/features')
    .reply(200, { features: [] }, { Etag: '12345-3' });

  const repo = new Repository({
    url,
    appName,
    instanceId,
    refreshInterval: 1000,
    bootstrapProvider: new DefaultBootstrapProvider({}),
    storageProvider: new InMemStorageProvider(),
    headers: {
      randomKey,
    },
    customHeadersFunction: () => Promise.resolve({ customHeaderKey }),
  });

  repo.etag = '12345-1';
  repo.once('unchanged', () => {
    t.end();
  });
  repo.once('changed', () => {
    t.is(repo.etag, '12345-3');
    t.end();
  });
  repo.start();
});

test.cb('should handle 404 request error and emit error event', t => {
  const url = 'http://unleash-test-5.app';
  nock(url)
    .persist()
    .get('/client/features')
    .reply(404, 'asd');

  const repo = new Repository({
    url,
    appName,
    instanceId,
    refreshInterval: 10000,
    bootstrapProvider: new DefaultBootstrapProvider({}),
    storageProvider: new InMemStorageProvider(),
  });

  repo.on('error', err => {
    t.truthy(err);
    t.true(err.message.startsWith('Response was not statusCode 2'));
    t.end();
  });
  repo.start();
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
      url,
      appName,
      instanceId,
      refreshInterval: 0,
      bootstrapProvider: new DefaultBootstrapProvider({}),
      storageProvider: new InMemStorageProvider(),
    });
    repo.on('error', reject);
    repo.on('unchanged', resolve);
    process.nextTick(resolve);
    repo.start();
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
      url,
      appName,
      instanceId,
      bootstrapProvider: new DefaultBootstrapProvider({}),
      storageProvider: new InMemStorageProvider(),
    });
    repo.on('error', err => {
      t.truthy(err);
      t.true(
        err.message.indexOf('Unexpected token') > -1 ||
                    err.message.indexOf('Unexpected end of JSON input') > -1,
      );
      resolve();
    });
    repo.on('unchanged', resolve);
    repo.on('changed', reject);
    repo.start();
  }));
/*
test('should respect timeout', t =>
    new Promise((resolve, reject) => {
        const url = 'http://unleash-test-8.app';
        nock(url)
            .persist()
            .get('/client/features')
            .socketDelay(2000)
            .reply(200, 'OK');

        const repo = new Repository({
            url,
            appName,
            instanceId,
            refreshInterval: 0,
            StorageImpl: MockStorage,
            timeout: 50,
        });
        repo.on('error', err => {
            t.truthy(err);
            t.true(err.message.indexOf('ESOCKETTIMEDOUT') > -1);
            resolve();
        });
        repo.on('data', reject);
    }));
*/

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
    url,
    appName,
    instanceId,
    bootstrapProvider: new DefaultBootstrapProvider({}),
    storageProvider: new InMemStorageProvider(),
  });

  repo.once('error', err => {
    t.truthy(err);
    t.end();
  });

  repo.start();
});

test.cb('should emit errors on invalid variant', t => {
  const url = 'http://unleash-test-1-invalid-bariant.app';
  setup(url, [
    {
      name: 'feature',
      enabled: true,
      strategies: [
        {
          name: 'default',
        },
      ],
      variants: 'not legal',
    },
  ]);
  const repo = new Repository({
    url,
    appName,
    instanceId,
    bootstrapProvider: new DefaultBootstrapProvider({}),
    storageProvider: new InMemStorageProvider(),
  });

  repo.once('error', err => {
    t.truthy(err);
    t.is(err.message, 'feature.variants should be an array, but was string');
    t.end();
  });

  repo.start();
});

test.cb('should load bootstrap first if faster than unleash-api', t => {
  const url = 'http://unleash-test-2-api-url.app';
  const bootstrap = 'http://unleash-test-2-boostrap-url.app';
  nock(url)
    .persist()
    .get('/client/features')
    .delay(100)
    .reply(200, { features: [
      {
        name: 'feature',
        enabled: true,
        strategies: [
          {
            name: 'default',
          },
          {
            name: 'unleash-api',
          },
        ],
      },
    ]});
  nock(bootstrap)
    .persist()
    .get('/')
    .reply(200, { features: [
      {
        name: 'feature',
        enabled: false,
        strategies: [
          {
            name: 'default',
          },
          {
            name: 'bootstrap',
          },
        ],
      },
    ]});
  const repo = new Repository({
    url,
    appName,
    instanceId,
    bootstrapProvider: new DefaultBootstrapProvider({url: bootstrap}),
    storageProvider: new InMemStorageProvider(),
  });

  let counter = 0;

  repo.on('changed', () => {
    counter++;
    if(counter === 2) {
      t.is(repo.getToggle('feature').enabled, true);
      t.end();
    }
  });
  repo.start();
});

test.cb('bootstrap should not override actual data', t => {
  const url = 'http://unleash-test-2-api-url.app';
  const bootstrap = 'http://unleash-test-2-boostrap-url.app';
  nock(url)
    .persist()
    .get('/client/features')
    .reply(200, { features: [
      {
        name: 'feature',
        enabled: true,
        strategies: [
          {
            name: 'default',
          },
          {
            name: 'unleash-api',
          },
        ],
      },
    ]});
  nock(bootstrap)
    .persist()
    .get('/')
    .delay(100)
    .reply(200, { features: [
      {
        name: 'feature',
        enabled: false,
        strategies: [
          {
            name: 'default',
          },
          {
            name: 'bootstrap',
          },
        ],
      },
    ]});
  const repo = new Repository({
    url,
    appName,
    instanceId,
    bootstrapProvider: new DefaultBootstrapProvider({url: bootstrap}),
    storageProvider: new InMemStorageProvider(),
  });

  let counter = 0;

  repo.on('changed', () => {
    counter++;
    if(counter === 2) {
      t.is(repo.getToggle('feature').enabled, true);
      t.end();
    }
  });
  repo.start();
});

test.cb('should load bootstrap first from file', t => {
  const url = 'http://unleash-test-3-api-url.app';
  nock(url)
    .persist()
    .get('/client/features')
    .delay(100)
    .reply(408);

  const path = join(tmpdir(), `test-bootstrap-${Math.round(Math.random() * 100000)}`);
  writeFileSync(path, JSON.stringify({ features: [
    {
      name: 'feature-bootstrap',
      enabled: true,
      strategies: [
        {
          name: 'default',
        },
        {
          name: 'bootstrap',
        },
      ],
    },
  ]}));

  const repo = new Repository({
    url,
    appName,
    instanceId,
    refreshInterval: 0,
    bootstrapProvider: new DefaultBootstrapProvider({filePath: path}),
    storageProvider: new InMemStorageProvider(),
  });

  repo.on('changed', () => {
    t.is(repo.getToggle('feature-bootstrap').enabled, true);
    t.end();
  });
  repo.start();
});

test.cb('should not crash on bogus bootstrap', t => {
  const url = 'http://unleash-test-4-api-url.app';
  nock(url)
    .persist()
    .get('/client/features')
    .delay(100)
    .reply(408);

  const path = join(tmpdir(), `test-bootstrap-${Math.round(Math.random() * 100000)}`);
  writeFileSync(path, 'just a random blob');

  const repo = new Repository({
    url,
    appName,
    instanceId,
    refreshInterval: 0,
    bootstrapProvider: new DefaultBootstrapProvider({filePath: path}),
    storageProvider: new InMemStorageProvider(),
  });

  repo.on('warn', (msg) => {
    t.true(msg.startsWith('Unleash SDK was unable to load bootstrap'));
    t.end();
  });
  repo.start();
});

test.cb('should load backup-file', t => {
  const appNameLocal = 'some-backup';
  const url = 'http://unleash-test-backup-api-url.app';
  nock(url)
    .persist()
    .get('/client/features')
    .delay(100)
    .reply(408);

  const backupPath = join(tmpdir());
  const backupFile = join(backupPath, `/unleash-backup-${appNameLocal}.json`)
  writeFileSync(backupFile, JSON.stringify({ features: [
    {
      name: 'feature-backup',
      enabled: true,
      strategies: [
        {
          name: 'default',
        },
        {
          name: 'backup',
        },
      ],
    },
  ]}));

  const repo = new Repository({
    url,
    appName: appNameLocal,
    instanceId,
    refreshInterval: 0,
    bootstrapProvider: new DefaultBootstrapProvider({}),
    storageProvider: new FileStorageProvider(backupPath),
  });

  repo.on('ready', () => {
    t.is(repo.getToggle('feature-backup').enabled, true);
    t.end();
  });
  repo.start();
});

test.cb('bootstrap should override load backup-file', t => {
  const appNameLocal = 'should_override';
  const url = 'http://unleash-test-backup-api-url.app';
  nock(url)
    .persist()
    .get('/client/features')
    .delay(100)
    .reply(408);

  const backupPath = join(tmpdir());
  const backupFile = join(backupPath, `/unleash-backup-${appNameLocal}.json`)
  writeFileSync(backupFile, JSON.stringify({ features: [
    {
      name: 'feature-backup',
      enabled: true,
      strategies: [
        {
          name: 'default',
        },
        {
          name: 'backup',
        },
      ],
    },
  ]}));

  const repo = new Repository({
    url,
    appName: appNameLocal,
    instanceId,
    refreshInterval: 0,
    disableFetch: true,
    bootstrapProvider: new DefaultBootstrapProvider({
      data: [{
        name: 'feature-backup',
        enabled: false,
        strategies: [
          {
            name: 'default',
          },
          {
            name: 'bootstrap',
          },
        ],
      }]}),
    storageProvider: new FileStorageProvider(backupPath),
  });

  repo.on('changed', () => {
    t.is(repo.getToggle('feature-backup').enabled, false);
    t.end();
  });
  repo.on('error', () => {});
  repo.start();
});


test('bootstrap should not override load backup-file', async t => {
  const appNameLocal = 'should_not_override';
  const url = 'http://unleash-test-backup-api-url.app';
  nock(url)
    .persist()
    .get('/client/features')
    .reply(408);

  nock(url)
    .persist()
    .get('/bootstrap')
    .delay(1)
    .reply(200, { features: [
      {
        name: 'feature-backup',
        enabled: false,
        strategies: [
          {
            name: 'default',
          },
          {
            name: 'bootstrap',
          },
        ],
      },
    ]});

  const storeImp = new InMemStorageProvider();
  storeImp.set(appNameLocal, { features: [
    {
      name: 'feature-backup',
      enabled: true,
      strategies: [
        {
          name: 'default',
        },
        {
          name: 'backup',
        },
      ],
    },
  ]});


  const repo = new Repository({
    url,
    appName: appNameLocal,
    instanceId,
    refreshInterval: 0,
    bootstrapProvider: new DefaultBootstrapProvider({
      url: `${url}/bootstrap`
    }),
    bootstrapOverride: false,
    storageProvider: storeImp,
  });

  repo.on('error', () => {});

  await repo.start();

  t.is(repo.getToggle('feature-backup').enabled, true);
});
