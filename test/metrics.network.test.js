import test from 'ava';
import Metrics from '../lib/metrics';
import 'isomorphic-fetch';

// test.before(() => nock.disableNetConnect());
// test.after(() => nock.enableNetConnect());

test.cb('registerInstance should emit error when request error', t => {
    const url = `http://metrics${new Date().getTime()}1.app`;

    const metrics = new Metrics({
        url,
    });

    metrics.on('error', e => {
        t.truthy(e);
        t.end();
    });

    metrics.registerInstance();
});

test.cb('sendMetrics should emit error when request error', t => {
    const url = `http://metrics${new Date().getTime()}2.app`;

    const metrics = new Metrics({
        url,
    });
    metrics.on('error', e => {
        t.truthy(e);
        t.end();
    });

    metrics.count('x', true);

    metrics.sendMetrics();
});
