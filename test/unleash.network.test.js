import test from 'ava';
import nock from 'nock';
import { tmpdir } from 'os';
import { join } from 'path';
import { Unleash } from '../lib/unleash';

test.before(() => {
  // nock.disableNetConnect();
});
test.after(() => nock.enableNetConnect());

test.cb('should emit network errors', (t) => {
  const featuresCall = nock('http://blocked.app').get('/client/features').replyWithError('Network error');
  const registerCall = nock('http://blocked.app').post('/client/regiest').replyWithError('Network error');
  const metricsCall = nock('http://blocked.app').post('/client/metrics').replyWithError('Network error');

  t.plan(3);
  const backupPath = join(tmpdir(), `test-tmp-${Math.round(Math.random() * 100000)}`);
  const unleash = new Unleash({
    appName: 'network',
    url: 'http://blocked.app',
    refreshInterval: 20000,
    metricsInterval: 20000,
    timeout: 10,
    disableMetrics: false,
    backupPath,
  });

  unleash.on('error', (e) => {
    t.truthy(e);
  });

  unleash.isEnabled('some-toggle');
  unleash.metrics.sendMetrics();

  setTimeout(() => {
    unleash.destroy();
    process.nextTick(() => {
      t.truthy(featuresCall.isDone());
      t.truthy(registerCall.isDone());
      t.truthy(metricsCall.isDone());
      t.end();
    });
  }, 10);
});

