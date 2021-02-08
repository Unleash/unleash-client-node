import test from 'ava';
import nock from 'nock';
import Metrics from '../lib/metrics';

test.before(() => nock.disableNetConnect());
test.after(() => nock.enableNetConnect());

test.cb('registerInstance should emit error when request error', (t) => {
  const url = 'http://metrics1.app/';

  const metrics = new Metrics({
    url,
  });
  metrics.on('error', (e) => {
    t.truthy(e);
    t.end();
  });

  metrics.registerInstance().then((result) => {
    t.true(result);
    t.end();
  });
});

test.cb('sendMetrics should emit error when request error', (t) => {
  const url = 'http://metrics2.app/';

  const metrics = new Metrics({
    url,
  });
  metrics.on('error', (e) => {
    t.truthy(e);
    t.end();
  });

  metrics.count('x', true);

  metrics.sendMetrics().then((result) => {
    t.true(result);
    t.end();
  });
});
