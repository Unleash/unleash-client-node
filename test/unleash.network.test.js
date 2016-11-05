import test from 'ava';
import nock from 'nock';
import { tmpdir } from 'os';
import { join } from 'path';
import { Unleash } from '../lib/unleash';

test.before(() => nock.disableNetConnect());
test.after(() => nock.enableNetConnect());

test.cb('should emit network errors', (t) => {
    t.plan(3);
    const backupPath = join(tmpdir(), `test-tmp-${Math.round(Math.random() * 100000)}`);
    const unleash = new Unleash({
        appName: 'network',
        url: 'http://error.github.io',
        refreshInterval: 10000,
        metricsInterval: 80,
        disableMetrics: false,
        backupPath,
    });

    unleash.isEnabled('some-toggle');

    unleash.on('error', (e) => {
        t.truthy(e);
        console.log(e.message);
    });

    unleash.on('warn', (e) => {
        t.falsy(e);
    });

    return setTimeout(() => {
        unleash.destroy();
        process.nextTick(() => {
            t.end();
        });
    }, 100);
});
