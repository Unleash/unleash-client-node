import test from 'ava';

import { ApplicationHostnameStrategy } from '../../lib/strategy/application-hostname-strategy';

test('strategy should have correct name', t => {
    const strategy = new ApplicationHostnameStrategy();
    t.deepEqual(strategy.name, 'applicationHostname');
});

test('strategy should be disabled when no hostname defined', t => {
    const strategy = new ApplicationHostnameStrategy();
    const context = { hostNames: 'asdasdasd' };
    t.false(strategy.isEnabled(context));
});

test('strategy should be enabled when hostname is defined', t => {
    process.env.HOSTNAME = 'testi';
    const strategy = new ApplicationHostnameStrategy();
    const context = { hostNames: 'testi' };
    t.true(strategy.isEnabled(context));
});

test('strategy should be enabled when hostname is defined in list', t => {
    process.env.HOSTNAME = 'adasa';
    const strategy = new ApplicationHostnameStrategy();
    const context = { hostNames: `localhost, adasa` };
    t.true(strategy.isEnabled(context));
});

test('strategy should be enabled when hostname is defined via env', t => {
    process.env.HOSTNAME = 'some-random-name';
    const strategy = new ApplicationHostnameStrategy();
    const context = { hostNames: 'localhost, some-random-name' };
    t.true(strategy.isEnabled(context));
});

test('strategy should handle wierd casing', t => {
    process.env.HOSTNAME = 'some-random-NAME';
    const strategy = new ApplicationHostnameStrategy();
    const context = { hostNames: 'localhost, some-random-name' };
    t.true(strategy.isEnabled(context));
});
