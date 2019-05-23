import test from 'ava';

import { MatchingStrategy } from '../../lib/strategy/matching-strategy';

test('MatchingStrategy should have correct name', t => {
    const strategy = new MatchingStrategy();
    t.deepEqual(strategy.name, 'MatchingStrategy');
});

test('MatchingStrategy should be enabled for environment=dev', t => {
    const strategy = new MatchingStrategy();
    const params = { rollout: 100 };
    const constraints = [{ contextName: 'environment', operator: 'IN', values: ['stage', 'dev'] }];
    const context = { environment: 'dev' };
    t.true(strategy.isEnabled(params, context, constraints));
});

test('MatchingStrategy should NOT be enabled for environment=prod', t => {
    const strategy = new MatchingStrategy();
    const params = { rollout: 100 };
    const constraints = [{ contextName: 'environment', operator: 'IN', values: ['dev'] }];
    const context = { environment: 'prod' };
    t.false(strategy.isEnabled(params, context, constraints));
});

test('MatchingStrategy should NOT be enabled for environment=prod AND userId=123', t => {
    const strategy = new MatchingStrategy();
    const params = { rollout: 100 };
    const constraints = [
        { contextName: 'environment', operator: 'IN', values: ['dev'] },
        { contextName: 'userId', operator: 'IN', values: ['123'] },
    ];
    const context = { environment: 'prod', userId: '123' };
    t.false(strategy.isEnabled(params, context, constraints));
});

test('MatchingStrategy should NOT be enabled for environment=dev AND rollout=10% when userId is 123', t => {
    const strategy = new MatchingStrategy();
    const params = { rollout: 10, stickiness: 'default', groupId: 'toggleName' };
    const constraints = [{ contextName: 'environment', operator: 'IN', values: ['dev'] }];
    const context = { environment: 'dev', userId: '123' };
    t.false(strategy.isEnabled(params, context, constraints));
});

test('MatchingStrategy should be enabled when constraints is empty list', t => {
    const strategy = new MatchingStrategy();
    const params = { rollout: 100, stickiness: 'default', groupId: 'toggleName' };
    const constraints = [];
    const context = { environment: 'dev', userId: '123' };
    t.true(strategy.isEnabled(params, context, constraints));
});

test('MatchingStrategy should be enabled when constraints is undefined', t => {
    const strategy = new MatchingStrategy();
    const params = { rollout: 100, stickiness: 'default', groupId: 'toggleName' };
    const constraints = undefined;
    const context = { environment: 'dev', userId: '123' };
    t.true(strategy.isEnabled(params, context, constraints));
});

test('MatchingStrategy should be enabled when environment NOT_IN constaints', t => {
    const strategy = new MatchingStrategy();
    const params = { rollout: 100, stickiness: 'default', groupId: 'toggleName' };
    const constraints = [
        { contextName: 'environment', operator: 'NOT_IN', values: ['dev', 'stage'] },
    ];
    const context = { environment: 'local', userId: '123' };
    t.true(strategy.isEnabled(params, context, constraints));
});

test('should not enabled for multiple constraints where last one is not satisfied', t => {
    const strategy = new MatchingStrategy();
    const params = { rollout: 100, stickiness: 'default', groupId: 'toggleName' };
    const constraints = [
        { contextName: 'environment', operator: 'NOT_IN', values: ['dev', 'stage'] },
        { contextName: 'environment', operator: 'IN', values: ['prod'] },
    ];
    const context = { environment: 'local', userId: '123' };
    t.false(strategy.isEnabled(params, context, constraints));
});
