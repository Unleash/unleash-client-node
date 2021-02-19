import test from 'ava';
import nock from 'nock';
import { tmpdir } from 'os';
import { join } from 'path';
import mkdirp from 'mkdirp';
import sinon from 'sinon';
import FakeRepo from './fake_repo';

import { Strategy, Unleash } from '../lib/unleash';

class EnvironmentStrategy extends Strategy {
  constructor() {
    super('EnvironmentStrategy');
  }

  isEnabled(parameters, context) {
    return parameters.environments.indexOf(context.environment) !== -1;
  }
}

let counter = 1;
const getUrl = () => `http://test2${counter++}.app/`;

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
  {
    name: 'f-context',
    enabled: true,
    strategies: [
      {
        name: 'EnvironmentStrategy',
        parameters: {
          environments: 'prod',
        },
      },
    ],
  },
];

function mockNetwork(toggles = defaultToggles, url = getUrl()) {
  nock(url)
    .get('/client/features')
    .reply(200, { features: toggles });
  return url;
}

test('should error when missing url', t => {
  t.throws(() => new Unleash({}));
  t.throws(() => new Unleash({ url: false }));
  t.throws(() => new Unleash({ url: 'http://unleash.github.io', appName: false }));
});

test('calling destroy synchronously should avoid network activity', t => {
  const url = getUrl();
  // Don't call mockNetwork. If destroy didn't work, then we would have an
  // uncaught exception.
  const instance = new Unleash({
    appName: 'foo',
    url,
    disableMetrics: true,
  });
  instance.destroy();
  t.true(true);
});

test.cb('should handle old url', t => {
  const url = mockNetwork([]);

  const instance = new Unleash({
    appName: 'foo',
    refreshInterval: 0,
    metricsInterval: 0,
    disableMetrics: true,
    url: `${url}features`,
  });

  t.plan(1);
  instance.on('warn', e => {
    t.truthy(e);
    t.end();
  });

  instance.destroy();
});

test('should handle url without ending /', t => {
  const baseUrl = `${getUrl()}api`;

  mockNetwork([], baseUrl);

  const instance = new Unleash({
    appName: 'foo',
    refreshInterval: 0,
    metricsInterval: 0,
    disableMetrics: true,
    url: baseUrl,
  });

  t.true(`${baseUrl}/` === instance.repository.url);
  t.true(`${baseUrl}/` === instance.metrics.url);

  instance.destroy();
});

test('should re-emit error from repository, storage and metrics', t => {
  const url = mockNetwork([]);

  const instance = new Unleash({
    appName: 'foo',
    refreshInterval: 0,
    metricsInterval: 0,
    disableMetrics: true,
    url,
  });

  t.plan(3);
  instance.on('error', e => {
    t.truthy(e);
  });
  instance.repository.emit('error', new Error());
  instance.repository.storage.emit('error', new Error());
  instance.metrics.emit('error', new Error());

  instance.destroy();
});

test('should re-emit events from repository and metrics', t => {
  const url = mockNetwork();
  const instance = new Unleash({
    appName: 'foo',
    refreshInterval: 0,
    disableMetrics: true,
    url,
  });

  t.plan(5);
  instance.on('warn', e => t.truthy(e));
  instance.on('sent', e => t.truthy(e));
  instance.on('registered', e => t.truthy(e));
  instance.on('count', e => t.truthy(e));

  instance.repository.emit('warn', true);
  instance.metrics.emit('warn', true);
  instance.metrics.emit('sent', true);
  instance.metrics.emit('registered', true);
  instance.metrics.emit('count', true);

  instance.destroy();
});

test.cb('repository should surface error when invalid basePath', t => {
  const url = 'http://unleash-surface.app/';
  nock(url)
    .get('/client/features')
    .delay(100)
    .reply(200, { features: [] });
  const backupPath = join(tmpdir(), `test-tmp-${Math.round(Math.random() * 100000)}`);
  const instance = new Unleash({
    appName: 'foo',
    disableMetrics: true,
    refreshInterval: 0,
    url,
    backupPath,
  });

  instance.once('error', err => {
    t.truthy(err);
    t.true(err.code === 'ENOENT');

    instance.destroy();

    t.end();
  });
});

test('should allow request even before unleash is initialized', t => {
  const url = mockNetwork();
  const instance = new Unleash({
    appName: 'foo',
    disableMetrics: true,
    url,
    backupPath: getRandomBackupPath(),
  }).on('error', err => {
    throw err;
  });
  t.true(instance.isEnabled('unknown') === false);
  instance.destroy();
});

test('should consider known feature-toggle as active', t =>
  new Promise((resolve, reject) => {
    const url = mockNetwork();
    const instance = new Unleash({
      appName: 'foo',
      disableMetrics: true,
      url,
      backupPath: getRandomBackupPath(),
    }).on('error', reject);

    instance.on('ready', () => {
      t.true(instance.isEnabled('feature') === true);
      instance.destroy();
      resolve();
    });
  }));

test('should consider unknown feature-toggle as disabled', t =>
  new Promise((resolve, reject) => {
    const url = mockNetwork();
    const instance = new Unleash({
      appName: 'foo',
      disableMetrics: true,
      url,
      backupPath: getRandomBackupPath(),
    }).on('error', reject);

    instance.on('ready', () => {
      t.true(instance.isEnabled('unknown') === false);
      instance.destroy();
      resolve();
    });
  }));

test('should return fallback value until online', t =>
  new Promise((resolve, reject) => {
    const url = mockNetwork();
    const instance = new Unleash({
      appName: 'foo',
      disableMetrics: true,
      url,
      backupPath: getRandomBackupPath(),
    }).on('error', reject);

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

test('should call fallback function for unknown feature-toggle', t =>
  new Promise((resolve, reject) => {
    const url = mockNetwork();
    const instance = new Unleash({
      appName: 'foo',
      environment: 'test',
      disableMetrics: true,
      url,
      backupPath: getRandomBackupPath(),
    }).on('error', reject);

    instance.on('ready', () => {
      const fallbackFunc = sinon.spy(() => false);
      const name = 'unknown';
      const result = instance.isEnabled(name, { userId: '123' }, fallbackFunc);
      t.true(result === false);
      t.true(fallbackFunc.called);
      t.true(
        fallbackFunc.firstCall.calledWith(name, {
          appName: 'foo',
          environment: 'test',
          userId: '123',
        }),
      );
      instance.destroy();
      resolve();
    });
  }));

test('should not throw when os.userInfo throws', t => {
  t.plan(0);

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line global-require
    require('os').userInfo = () => {
      throw new Error('Test exception');
    };
    const url = mockNetwork();
    const instance = new Unleash({
      appName: 'foo',
      disableMetrics: true,
      url,
      backupPath: getRandomBackupPath(),
    }).on('error', reject);

    instance.on('ready', () => {
      resolve();
    });
  });
});

test('should return known feature-toggle definition', t =>
  new Promise((resolve, reject) => {
    const url = mockNetwork();
    const instance = new Unleash({
      appName: 'foo',
      disableMetrics: true,
      url,
      backupPath: getRandomBackupPath(),
    }).on('error', reject);

    instance.on('ready', () => {
      const toggle = instance.getFeatureToggleDefinition('feature');
      t.truthy(toggle);
      instance.destroy();
      resolve();
    });
  }));

test('should return feature-toggles', t =>
  new Promise((resolve, reject) => {
    const url = mockNetwork();
    const instance = new Unleash({
      appName: 'foo',
      disableMetrics: true,
      url,
      backupPath: getRandomBackupPath(),
    }).on('error', reject);

    instance.on('ready', () => {
      const toggles = instance.getFeatureToggleDefinitions();
      t.deepEqual(toggles, defaultToggles);
      instance.destroy();
      resolve();
    });
  }));

test('returns undefined for unknown feature-toggle definition', t =>
  new Promise((resolve, reject) => {
    const url = mockNetwork();
    const instance = new Unleash({
      appName: 'foo',
      disableMetrics: true,
      url,
      backupPath: getRandomBackupPath(),
    }).on('error', reject);

    instance.on('ready', () => {
      const toggle = instance.getFeatureToggleDefinition('unknown');
      t.falsy(toggle);
      instance.destroy();
      resolve();
    });
  }));

test('should use the injected repository', t =>
  new Promise((resolve, reject) => {
    const repo = new FakeRepo();
    const url = mockNetwork();
    const instance = new Unleash({
      appName: 'foo',
      disableMetrics: true,
      url,
      backupPath: getRandomBackupPath(),
      repository: repo,
    }).on('error', reject);
    instance.on('ready', () => {
      t.false(instance.isEnabled('fake-feature'));
      instance.destroy();
      resolve();
    });
    repo.emit('ready');
  }));

test('should add static context fields', t =>
  new Promise((resolve, reject) => {
    const url = mockNetwork();
    const instance = new Unleash({
      appName: 'foo',
      disableMetrics: true,
      url,
      backupPath: getRandomBackupPath(),
      environment: 'prod',
      strategies: [new EnvironmentStrategy()],
    }).on('error', reject);

    instance.on('ready', () => {
      t.true(instance.isEnabled('f-context') === true);
      instance.destroy();
      resolve();
    });
  }));

test('should local context should take precedence over static context fields', t =>
  new Promise((resolve, reject) => {
    const url = mockNetwork();
    const instance = new Unleash({
      appName: 'foo',
      disableMetrics: true,
      url,
      backupPath: getRandomBackupPath(),
      environment: 'prod',
      strategies: [new EnvironmentStrategy()],
    }).on('error', reject);

    instance.on('ready', () => {
      t.true(instance.isEnabled('f-context', { environment: 'dev' }) === false);
      instance.destroy();
      resolve();
    });
  }));

test('should call client/features with projectName query parameter if projectName is set', t => {
  const baseUrl = getUrl();
  const project = 'myProject';

  nock(baseUrl)
    .get('/client/features')
    .query({ project })
    .reply(200, { features: [] });

  const instance = new Unleash({
    appName: 'foo',
    disableMetrics: true,
    backupPath: getRandomBackupPath(),
    url: baseUrl,
    projectName: project,
  });

  t.assert(instance.repository.projectName === 'myProject');
});

test('should call client/features if no projectname set', t => {
  const baseUrl = getUrl();
  mockNetwork([], baseUrl);

  const instance = new Unleash({
    appName: 'foo',
    disableMetrics: true,
    backupPath: getRandomBackupPath(),
    url: baseUrl,
  });

  t.assert(instance.repository.projectName === undefined);
});

test('should distribute variants according to stickiness', async t => {
  const baseUrl = getUrl();
  nock(baseUrl)
    .get('/client/features')
    .reply(200, { features: [{
      name: 'toggle-with-variants',
      enabled: true,
      strategies: [{ name: 'default' }],
      variants: [{
        name: 'blue',
        weight: 1,
        stickiness: 'customField',
      },
      {
        name: 'red',
        weight: 1,
        stickiness: 'customField',
      },
      {
        name: 'green',
        weight: 1,
        stickiness: 'customField',
      },
      {
        name: 'yellow',
        weight: 1,
        stickiness: 'customField',
      }],
    }] });

  const unleash = new Unleash({
    appName: 'foo-variants',
    disableMetrics: true,
    backupPath: getRandomBackupPath(),
    url: baseUrl,
  });

  const counts = {
    red: 0,
    blue:0,
    green: 0,
    yellow: 0,
    sum: 0,
  };

  const genRandomValue = () => String(Math.round(Math.random() * 100000));

  return new Promise((resolve) => {
    unleash.on('ready', () => {

      for (let i = 0; i < 10000; i++) {
        const variant = unleash.getVariant('toggle-with-variants', { someField: genRandomValue() });
        counts[variant.name] ++;
        counts.sum ++;
      }

      const red = Math.round(counts.red / counts.sum * 100);
      const blue = Math.round(counts.blue / counts.sum * 100);
      const green = Math.round(counts.green / counts.sum * 100);
      const yellow = Math.round(counts.yellow / counts.sum * 100);

      t.true(red > 23 && red < 27, `red not within range: ${red}`);
      t.true(blue > 23 && blue < 27, `blue not within range: ${blue}`);
      t.true(green > 23 && green < 27, `green not within range: ${green}`);
      t.true(yellow > 23 && yellow < 27, `yellow not within range: ${yellow}`);
      resolve();
    });
  });
});


test('should distribute variants according to default stickiness', async t => {
  const baseUrl = getUrl();
  nock(baseUrl)
    .get('/client/features')
    .reply(200, { features: [{
      name: 'toggle-with-variants',
      enabled: true,
      strategies: [{ name: 'default' }],
      variants: [{
        name: 'blue',
        weight: 1,
      },
      {
        name: 'red',
        weight: 1,
      },
      {
        name: 'green',
        weight: 1,
      },
      {
        name: 'yellow',
        weight: 1,
      }],
    }] });

  const unleash = new Unleash({
    appName: 'foo-variants',
    disableMetrics: true,
    backupPath: getRandomBackupPath(),
    url: baseUrl,
  });

  const counts = {
    red: 0,
    blue:0,
    green: 0,
    yellow: 0,
    sum: 0,
  };

  const genRandomValue = () => String(Math.round(Math.random() * 100000));

  return new Promise((resolve) => {
    unleash.on('ready', () => {

      for (let i = 0; i < 10000; i++) {
        const variant = unleash.getVariant('toggle-with-variants', { userId: genRandomValue() });
        counts[variant.name] ++;
        counts.sum ++;
      }

      const red = Math.round(counts.red / counts.sum * 100);
      const blue = Math.round(counts.blue / counts.sum * 100);
      const green = Math.round(counts.green / counts.sum * 100);
      const yellow = Math.round(counts.yellow / counts.sum * 100);

      t.true(red > 23 && red < 27, `red not within range: ${red}`);
      t.true(blue > 23 && blue < 27, `blue not within range: ${blue}`);
      t.true(green > 23 && green < 27, `green not within range: ${green}`);
      t.true(yellow > 23 && yellow < 27, `yellow not within range: ${yellow}`);
      resolve();
    });
  });
});
test('should emit "synchronized" when data is received', t =>
  new Promise((resolve, reject) => {
    const url = mockNetwork();
    const instance = new Unleash({
      appName: 'foo',
      disableMetrics: true,
      url,
      backupPath: getRandomBackupPath(),
    }).on('error', reject);

    instance.on('synchronized', () => {
      t.true(instance.isEnabled('feature') === true);
      instance.destroy();
      resolve();
    });
  }));

test('should emit "synchronized" only first time', t =>
  new Promise((resolve, reject) => {
    let changedCount = 0;
    let synchronizedCount = 0;

    const url = getUrl();
    nock(url)
      .get('/client/features')
      .times(3)
      .reply(200, { features: defaultToggles });

    const instance = new Unleash({
      appName: 'foo',
      disableMetrics: true,
      refreshInterval: 1,
      url,
      backupPath: getRandomBackupPath(),
    }).on('error', reject);

    instance.on('changed', () => {
      changedCount += 1;
      if (changedCount > 2) {
        t.is(synchronizedCount, 1);
        instance.destroy();
        resolve();
      }
    });

    instance.on('synchronized', () => {
      synchronizedCount += 1;
    });
  }));

