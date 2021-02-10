import test from 'ava';
import nock from 'nock';
import Metrics from '../lib/metrics';

let counter = 1;
const getUrl = () => `http://test${counter++}.app/`;
const metricsUrl = '/client/metrics';
const nockMetrics = (url, code = 200) => nock(url)
  .post(metricsUrl)
  .reply(code, '');
const registerUrl = '/client/register';
const nockRegister = (url, code = 200) => nock(url)
  .post(registerUrl)
  .reply(code, '');

test('should be disabled by flag disableMetrics', (t) => {
  const metrics = new Metrics({ disableMetrics: true });
  metrics.count('foo', true);

  t.true(Object.keys(metrics.bucket.toggles).length === 0);
});

test.cb('registerInstance, sendMetrics, startTimer and count should respect disabled', (t) => {
  const url = getUrl();
  const metrics = new Metrics({
    url,
    disableMetrics: true,
  });
  t.true(!metrics.startTimer());
  t.true(!metrics.count());
  Promise.all([metrics.registerInstance(), metrics.sendMetrics()]).then((results) => {
    const [registerInstance, sendMetrics] = results;
    t.true(!registerInstance);
    t.true(!sendMetrics);
    t.end();
  });
});

test('should not start fetch/register when metricsInterval is 0', (t) => {
  const url = getUrl();
  const metrics = new Metrics({
    url,
    metricsInterval: 0,
  });

  t.true(metrics.timer === undefined);
});

test.cb('should sendMetrics and register when metricsInterval is a positive number', (t) => {
  const url = getUrl();
  t.plan(2);
  const metricsEP = nockMetrics(url);
  const regEP = nockRegister(url);

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
    t.end();
  });
});

test.cb('should sendMetrics', (t) => {
  const url = getUrl();
  t.plan(6);
  const metricsEP = nock(url)
    .post(metricsUrl, (payload) => {
      t.truthy(payload.bucket);
      t.truthy(payload.bucket.start);
      t.truthy(payload.bucket.stop);
      t.deepEqual(payload.bucket.toggles, {
        'toggle-x': { yes: 1, no: 1 },
        'toggle-y': { yes: 1, no: 0 },
      });
      return true;
    })
    .reply(200, '');
  const regEP = nockRegister(url);

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
    t.end();
  });
});

test.cb('should send custom headers', (t) => {
  const url = getUrl();
  t.plan(2);
  const randomKey = `value-${Math.random()}`;
  const metricsEP = nockMetrics(url).matchHeader('randomKey', randomKey);
  const regEP = nockRegister(url).matchHeader('randomKey', randomKey);

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
    t.end();
  });
});

test.cb('should send content-type header', (t) => {
  const url = getUrl();
  t.plan(2);
  const metricsEP = nockMetrics(url).matchHeader('content-type', 'application/json');
  const regEP = nockRegister(url).matchHeader('content-type', 'application/json');

  const metrics = new Metrics({
    url,
    metricsInterval: 50,
  });

  metrics.count('toggle-x', true);

  metrics.on('sent', () => {
    t.true(regEP.isDone());
    t.true(metricsEP.isDone());
    metrics.stop();
    t.end();
  });
});

test.cb('request with customHeadersFunction should take precedence over customHeaders', (t) => {
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
    t.end();
  });
});

/*
test.only('should respect timeout', t =>
    new Promise((resolve, reject) => {
        t.plan(2);
        const url = getUrl();
        nock(url)
            .post(metricsUrl)
            .socketDelay(100)
            .reply(200, '');

        nock(url)
            .post(registerUrl)
            .socketDelay(100)
            .reply(200, '');

        const metrics = new Metrics({
            url,
            metricsInterval: 50,
            timeout: 50,
        });

        metrics.on('error', err => {
            t.truthy(err);
            t.true(err.message.indexOf('ESOCKETTIMEDOUT') > -1);
            resolve();
        });
        metrics.on('sent', reject);
        metrics.count('toggle-x', true);
    }));
*/

test('registerInstance should warn when non 200 statusCode', async (t) => {
  t.plan(2);
  const url = getUrl();
  const regEP = nockRegister(url, 500);

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
});

test.cb('sendMetrics should stop/disable metrics if endpoint returns 404', (t) => {
  const url = getUrl();
  const metEP = nockMetrics(url, 404);
  const metrics = new Metrics({
    url,
  });

  metrics.on('warn', () => {
    metrics.stop();
    t.true(metEP.isDone());
    t.true(metrics.disabled);
    t.end();
  });

  metrics.count('x-y-z', true);

  metrics.sendMetrics();

  t.false(metrics.disabled);
});

test.cb('sendMetrics should emit warn on non 200 statusCode', (t) => {
  const url = getUrl();
  const metEP = nockMetrics(url, 500);

  const metrics = new Metrics({
    url,
  });

  metrics.on('warn', () => {
    t.true(metEP.isDone());
    t.end();
  });

  metrics.count('x-y-z', true);

  metrics.sendMetrics();
});

test.cb('sendMetrics should not send empty buckets', (t) => {
  const url = getUrl();
  const metEP = nockMetrics(url, 200);

  const metrics = new Metrics({
    url,
  });

  metrics.sendMetrics().then((result) => {
    t.true(result);

    setTimeout(() => {
      t.false(metEP.isDone());
      t.end();
    }, 10);
  });
});

test('count should increment yes and no counters', (t) => {
  const url = getUrl();
  const metrics = new Metrics({
    url,
  });

  const name = `name-${Math.round(Math.random() * 1000)}`;

  t.falsy(metrics.bucket.toggles[name]);

  metrics.count(name, true);

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
  const metrics = new Metrics({
    url,
  });

  const name = `name-${Math.round(Math.random() * 1000)}`;

  t.falsy(metrics.bucket.toggles[name]);

  metrics.count(name, true);

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
  const metrics = new Metrics({
    url,
  });

  const result = metrics.getClientData();
  t.true(typeof result === 'object');
});

test('getMetricsData should return a bucket', (t) => {
  const url = getUrl();
  const metrics = new Metrics({
    url,
  });

  const result = metrics.getMetricsData();
  t.true(typeof result === 'object');
  t.true(typeof result.bucket === 'object');
});
