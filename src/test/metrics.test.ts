import test from 'ava';
import * as nock from 'nock';
import Metrics from '../metrics';

let counter = 1;
const getUrl = () => `http://test${counter++}.app/`;
const metricsUrl = '/client/metrics';
const nockMetrics = (url: string, code = 200) => nock(url).post(metricsUrl).reply(code, '');
const registerUrl = '/client/register';
const nockRegister = (url: string, code = 200) => nock(url).post(registerUrl).reply(code, '');

test('should be disabled by flag disableMetrics', (t) => {
  // @ts-expect-error
  const metrics = new Metrics({ disableMetrics: true });
  metrics.count('foo', true);

  // @ts-expect-error
  t.true(Object.keys(metrics.bucket.toggles).length === 0);
});

test('registerInstance, sendMetrics, startTimer and count should respect disabled', (t) =>
  new Promise((resolve) => {
    const url = getUrl();
    // @ts-expect-error
    const metrics = new Metrics({
      url,
      disableMetrics: true,
    });
    // @ts-expect-error
    t.true(!metrics.startTimer());
    // @ts-expect-error
    t.true(!metrics.count());
    Promise.all([metrics.registerInstance(), metrics.sendMetrics()]).then((results) => {
      const [registerInstance, sendMetrics] = results;
      t.true(!registerInstance);
      // @ts-expect-error
      t.true(!sendMetrics);
      resolve();
    });
  }));

test('should not start fetch/register when metricsInterval is 0', (t) => {
  const url = getUrl();
  // @ts-expect-error
  const metrics = new Metrics({
    url,
    metricsInterval: 0,
  });

  // @ts-expect-error
  t.true(metrics.timer === undefined);
});

test('should sendMetrics and register when metricsInterval is a positive number', (t) =>
  new Promise((resolve) => {
    const url = getUrl();
    t.plan(2);
    const metricsEP = nockMetrics(url);
    const regEP = nockRegister(url);

    // @ts-expect-error
    const metrics = new Metrics({
      url,
      metricsInterval: 50,
    });

    metrics.count('toggle-x', true);
    metrics.count('toggle-x', false);
    metrics.count('toggle-y', true);

    metrics.on('registered', () => {
      t.true(regEP.isDone());
    });

    metrics.on('sent', () => {
      t.true(metricsEP.isDone());
      metrics.stop();
      resolve();
    });
    metrics.start();
  }));

test('should sendMetrics', (t) =>
  new Promise((resolve) => {
    const url = getUrl();
    t.plan(6);
    const metricsEP = nock(url)
      .post(metricsUrl, (payload) => {
        t.truthy(payload.bucket);
        t.truthy(payload.bucket.start);
        t.truthy(payload.bucket.stop);
        t.deepEqual(payload.bucket.toggles, {
          'toggle-x': { yes: 1, no: 1, variants: { 'variant-a': 2 } },
          'toggle-y': { yes: 1, no: 0, variants: {} },
        });
        return true;
      })
      .reply(200, '');
    const regEP = nockRegister(url);

    // @ts-expect-error
    const metrics = new Metrics({
      url,
      metricsInterval: 50,
    });

    metrics.count('toggle-x', true);
    metrics.count('toggle-x', false);
    metrics.count('toggle-y', true);
    metrics.countVariant('toggle-x', 'variant-a');
    metrics.countVariant('toggle-x', 'variant-a');

    metrics.on('registered', () => {
      t.true(regEP.isDone());
    });

    metrics.on('sent', () => {
      t.true(metricsEP.isDone());
      metrics.stop();
      resolve();
    });
    metrics.start();
  }));

test('should send custom headers', (t) =>
  new Promise((resolve) => {
    const url = getUrl();
    t.plan(2);
    const randomKey = `value-${Math.random()}`;
    const metricsEP = nockMetrics(url).matchHeader('randomKey', randomKey);
    const regEP = nockRegister(url).matchHeader('randomKey', randomKey);

    // @ts-expect-error
    const metrics = new Metrics({
      url,
      metricsInterval: 50,
      headers: {
        randomKey,
      },
    });

    metrics.count('toggle-x', true);
    metrics.count('toggle-x', false);
    metrics.count('toggle-y', true);

    metrics.on('sent', () => {
      t.true(regEP.isDone());
      t.true(metricsEP.isDone());
      metrics.stop();
      resolve();
    });
    metrics.start();
  }));

test('should send content-type header', (t) =>
  new Promise((resolve) => {
    const url = getUrl();
    t.plan(2);
    const metricsEP = nockMetrics(url).matchHeader('content-type', 'application/json');
    const regEP = nockRegister(url).matchHeader('content-type', 'application/json');

    // @ts-expect-error
    const metrics = new Metrics({
      url,
      metricsInterval: 50,
    });

    metrics.count('toggle-x', true);

    metrics.on('sent', () => {
      t.true(regEP.isDone());
      t.true(metricsEP.isDone());
      metrics.stop();
      resolve();
    });
    metrics.start();
  }));

test('request with customHeadersFunction should take precedence over customHeaders', (t) =>
  new Promise((resolve) => {
    const url = getUrl();
    t.plan(2);
    const customHeadersKey = `value-${Math.random()}`;
    const randomKey = `value-${Math.random()}`;
    const metricsEP = nockMetrics(url)
      .matchHeader('randomKey', (value) => value === undefined)
      .matchHeader('customHeadersKey', customHeadersKey);

    const regEP = nockRegister(url)
      .matchHeader('randomKey', (value) => value === undefined)
      .matchHeader('customHeadersKey', customHeadersKey);

    // @ts-expect-error
    const metrics = new Metrics({
      url,
      metricsInterval: 50,
      headers: {
        randomKey,
      },
      customHeadersFunction: () => Promise.resolve({ customHeadersKey }),
    });

    metrics.count('toggle-x', true);
    metrics.count('toggle-x', false);
    metrics.count('toggle-y', true);
    metrics.on('sent', () => {
      t.true(regEP.isDone());
      t.true(metricsEP.isDone());
      metrics.stop();
      resolve();
    });
    metrics.start();
  }));

test.skip('should respect timeout', (t) =>
  new Promise((resolve, reject) => {
    t.plan(2);
    const url = getUrl();
    // @ts-expect-error
    nock(url).post(metricsUrl).socketDelay(100).reply(200, '');

    // @ts-expect-error
    nock(url).post(registerUrl).socketDelay(100).reply(200, '');

    // @ts-expect-error
    const metrics = new Metrics({
      url,
      metricsInterval: 50,
      timeout: 50,
    });

    metrics.on('error', (err) => {
      t.truthy(err);
      t.true(err.message.indexOf('ESOCKETTIMEDOUT') > -1);
      resolve();
    });
    metrics.on('sent', reject);
    metrics.count('toggle-x', true);
    metrics.start();
  }));

test('registerInstance should warn when non 200 statusCode', async (t) => {
  t.plan(2);
  const url = getUrl();
  const regEP = nockRegister(url, 500);

  // @ts-expect-error
  const metrics = new Metrics({
    url,
  });
  metrics.on('error', (e) => {
    t.falsy(e);
  });

  metrics.on('warn', (e) => {
    t.true(regEP.isDone());
    t.truthy(e);
  });

  await metrics.registerInstance();
  metrics.start();
});

test('sendMetrics should stop/disable metrics if endpoint returns 404', (t) =>
  new Promise((resolve) => {
    const url = getUrl();
    const metEP = nockMetrics(url, 404);
    // @ts-expect-error
    const metrics = new Metrics({
      url,
    });

    metrics.on('warn', () => {
      metrics.stop();
      t.true(metEP.isDone());
      // @ts-expect-error
      t.true(metrics.disabled);
      resolve();
    });
    metrics.start();

    metrics.count('x-y-z', true);

    metrics.sendMetrics();

    // @ts-expect-error
    t.false(metrics.disabled);
  }));

test('sendMetrics should emit warn on non 200 statusCode', (t) =>
  new Promise((resolve) => {
    const url = getUrl();
    const metEP = nockMetrics(url, 500);

    // @ts-expect-error
    const metrics = new Metrics({
      url,
    });

    metrics.on('warn', () => {
      t.true(metEP.isDone());
      resolve();
    });
    metrics.start();

    metrics.count('x-y-z', true);

    metrics.sendMetrics();
  }));

test('sendMetrics should not send empty buckets', (t) =>
  new Promise((resolve) => {
    const url = getUrl();
    const metEP = nockMetrics(url, 200);

    // @ts-expect-error
    const metrics = new Metrics({
      url,
    });
    metrics.start();

    metrics.sendMetrics().then(() => {
      setTimeout(() => {
        t.false(metEP.isDone());
        resolve();
      }, 10);
    });
  }));

test('count should increment yes and no counters', (t) => {
  const url = getUrl();
  // @ts-expect-error
  const metrics = new Metrics({
    url,
  });
  metrics.start();

  const name = `name-${Math.round(Math.random() * 1000)}`;

  // @ts-expect-error
  t.falsy(metrics.bucket.toggles[name]);

  metrics.count(name, true);

  // @ts-expect-error
  const toggleCount = metrics.bucket.toggles[name];
  t.truthy(toggleCount);
  t.true(toggleCount.yes === 1);
  t.true(toggleCount.no === 0);

  metrics.count(name, true);
  metrics.count(name, true);
  metrics.count(name, false);
  metrics.count(name, false);
  metrics.count(name, false);
  metrics.count(name, false);

  t.true(toggleCount.yes === 3);
  t.true(toggleCount.no === 4);
});

test('count should increment yes and no counters with variants', (t) => {
  const url = getUrl();
  // @ts-expect-error
  const metrics = new Metrics({
    url,
  });
  metrics.start();

  const name = `name-${Math.round(Math.random() * 1000)}`;

  // @ts-expect-error
  t.falsy(metrics.bucket.toggles[name]);

  metrics.count(name, true);

  // @ts-expect-error
  const toggleCount = metrics.bucket.toggles[name];
  t.truthy(toggleCount);
  t.true(toggleCount.yes === 1);
  t.true(toggleCount.no === 0);

  metrics.countVariant(name, 'variant1');
  metrics.countVariant(name, 'variant1');
  metrics.count(name, false);
  metrics.count(name, false);
  metrics.countVariant(name, 'disabled');
  metrics.countVariant(name, 'disabled');
  metrics.countVariant(name, 'variant2');
  metrics.countVariant(name, 'variant2');
  metrics.countVariant(name, 'variant2');

  t.true(toggleCount.yes === 1);
  t.true(toggleCount.no === 2);
  t.true(toggleCount.variants.disabled === 2);
  t.true(toggleCount.variants.variant1 === 2);
  t.true(toggleCount.variants.variant2 === 3);
});

test('getClientData should return a object', (t) => {
  const url = getUrl();
  // @ts-expect-error
  const metrics = new Metrics({
    url,
  });
  metrics.start();

  const result = metrics.getClientData();
  t.true(typeof result === 'object');
});

test('getMetricsData should return a bucket', (t) => {
  const url = getUrl();
  // @ts-expect-error
  const metrics = new Metrics({
    url,
  });
  metrics.start();

  const result = metrics.createMetricsData();
  t.true(typeof result === 'object');
  t.true(typeof result.bucket === 'object');
});

test('should keep metrics if send is failing', (t) =>
  new Promise((resolve) => {
    const url = getUrl();
    t.plan(4);
    nock(url).post(metricsUrl).reply(500, '');

    nockRegister(url);

    // @ts-expect-error
    const metrics = new Metrics({
      url,
      metricsInterval: 50,
    });

    metrics.count('toggle-x', true);
    metrics.count('toggle-x', false);

    // variant
    metrics.count('toggle-y', true);
    metrics.countVariant('toggle-y', 'a');

    metrics.on('warn', () => {
      // additional count after warn
      metrics.count('toggle-y', true);

      metrics.stop();
      // @ts-expect-error
      t.is(metrics.bucket.toggles['toggle-x'].yes, 1);
      // @ts-expect-error
      t.is(metrics.bucket.toggles['toggle-x'].no, 1);
      // @ts-expect-error
      t.is(metrics.bucket.toggles['toggle-y'].yes, 2);
      // @ts-expect-error
      t.is(metrics.bucket.toggles['toggle-y'].variants.a, 1);
      resolve();
    });
    metrics.start();
  }));
