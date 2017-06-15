import test from 'ava';
import Metrics from '../lib/metrics';
import nock from 'nock';

test.before(() => nock.disableNetConnect());
test.after(() => nock.enableNetConnect());

test.cb('registerInstance should emit error when request error', t => {
    const url = 'http://metrics1.app/';

    const metrics = new Metrics({
        url,
    });
    metrics.on('error', e => {
        t.truthy(e);
        t.end();
    });

    t.true(metrics.registerInstance());
});

test.cb('sendMetrics should emit error when request error', t => {
    const url = 'http://metrics2.app/';

    const metrics = new Metrics({
        url,
    });
    metrics.on('error', e => {
        t.truthy(e);
        t.end();
    });

    metrics.count('x', true);

    t.true(metrics.sendMetrics());
});
