import test from 'ava';
import { tmpdir } from 'os';
import { join } from 'path';
import { Unleash } from '../lib/unleash';
import 'isomorphic-fetch';

// test.before(() => nock.disableNetConnect());
// test.after(() => nock.enableNetConnect());

test.cb('should emit network errors', t => {
    t.plan(3);
    const backupPath = join(tmpdir(), `test-tmp-${Math.round(Math.random() * 100000)}`);
    const unleash = new Unleash({
        appName: 'network',
        url: `http://blocked${new Date().getTime()}.app`,
        refreshInterval: 20000,
        metricsInterval: 20000,
        disableMetrics: false,
        backupPath,
    });

    unleash.on('error', e => {
        t.truthy(e);
    });

    unleash.isEnabled('some-toggle');
    unleash.metrics.sendMetrics();

    setTimeout(() => {
        unleash.destroy();
        setImmediate(() => {
            t.end();
        });
    }, 3000);
});
