import test from 'ava';
import sinon from 'sinon';

import { FlexibleRolloutStrategy } from '../../lib/strategy/flexible-rollout-strategy';

test('should have correct name', t => {
    const strategy = new FlexibleRolloutStrategy();
    t.deepEqual(strategy.name, 'FlexibleRollout');
});

test('should be enabled for environment=dev', t => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: 100 };
    const constraints = [{ contextName: 'environment', operator: 'IN', values: ['stage', 'dev'] }];
    const context = { environment: 'dev' };
    t.true(strategy.isEnabled(params, context, constraints));
});

test('should NOT be enabled for environment=prod', t => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: 100 };
    const constraints = [{ contextName: 'environment', operator: 'IN', values: ['dev'] }];
    const context = { environment: 'prod' };
    t.false(strategy.isEnabled(params, context, constraints));
});

test('should NOT be enabled for environment=prod AND userId=123', t => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: 100 };
    const constraints = [
        { contextName: 'environment', operator: 'IN', values: ['dev'] },
        { contextName: 'userId', operator: 'IN', values: ['123'] },
    ];
    const context = { environment: 'prod', userId: '123' };
    t.false(strategy.isEnabled(params, context, constraints));
});

test('should NOT be enabled for environment=dev AND rollout=10% when userId is 123', t => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: 10, stickiness: 'default', groupId: 'toggleName' };
    const constraints = [{ contextName: 'environment', operator: 'IN', values: ['dev'] }];
    const context = { environment: 'dev', userId: '123' };
    t.false(strategy.isEnabled(params, context, constraints));
});

test('should be enabled when constraints is empty list', t => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: 100, stickiness: 'default', groupId: 'toggleName' };
    const constraints = [];
    const context = { environment: 'dev', userId: '123' };
    t.true(strategy.isEnabled(params, context, constraints));
});

test('should be enabled when constraints is undefined', t => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: 100, stickiness: 'default', groupId: 'toggleName' };
    const constraints = undefined;
    const context = { environment: 'dev', userId: '123' };
    t.true(strategy.isEnabled(params, context, constraints));
});

test('should be enabled when environment NOT_IN constaints', t => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: 100, stickiness: 'default', groupId: 'toggleName' };
    const constraints = [
        { contextName: 'environment', operator: 'NOT_IN', values: ['dev', 'stage'] },
    ];
    const context = { environment: 'local', userId: '123' };
    t.true(strategy.isEnabled(params, context, constraints));
});

test('should not enabled for multiple constraints where last one is not satisfied', t => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: 100, stickiness: 'default', groupId: 'toggleName' };
    const constraints = [
        { contextName: 'environment', operator: 'NOT_IN', values: ['dev', 'stage'] },
        { contextName: 'environment', operator: 'IN', values: ['prod'] },
    ];
    const context = { environment: 'local', userId: '123' };
    t.false(strategy.isEnabled(params, context, constraints));
});

test('should not enabled for multiple constraints where all are satisfied', t => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: 100, stickiness: 'default', groupId: 'toggleName' };
    const constraints = [
        { contextName: 'environment', operator: 'NOT_IN', values: ['dev', 'stage'] },
        { contextName: 'environment', operator: 'IN', values: ['prod'] },
        { contextName: 'userId', operator: 'IN', values: ['123', '223'] },
        { contextName: 'application', operator: 'IN', values: ['web'] },
    ];
    const context = { environment: 'prod', userId: '123', application: 'web' };
    t.true(strategy.isEnabled(params, context, constraints));
});

test('should NOT be enabled for userId=61 and rollout=9', t => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: 9, stickiness: 'default', groupId: 'Demo' };
    const constraints = [];
    const context = { userId: '61', application: 'web' };
    t.false(strategy.isEnabled(params, context, constraints));
});

test('should be enabled for userId=61 and rollout=10', t => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: '10', stickiness: 'default', groupId: 'Demo' };
    const constraints = [];
    const context = { userId: '61', application: 'web' };
    t.true(strategy.isEnabled(params, context, constraints));
});

test('should be disabled when stickiness=userId and userId not on context', t => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: '100', stickiness: 'userId', groupId: 'Demo' };
    const constraints = [];
    const context = {};
    t.false(strategy.isEnabled(params, context, constraints));
});

test('should fallback to random if stickiness=default and empty context', t => {
    const randomGenerator = sinon.fake.returns('42');

    const strategy = new FlexibleRolloutStrategy(randomGenerator);
    const params = { rollout: '100', stickiness: 'default', groupId: 'Demo' };
    const constraints = [];
    const context = {};

    t.true(strategy.isEnabled(params, context, constraints));
    t.true(randomGenerator.called);
});

test('should be enabled when cosutomerId is in constraint', t => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: '100', stickiness: 'default', groupId: 'Demo' };
    const constraints = [
        { contextName: 'environment', operator: 'IN', values: ['dev', 'stage'] },
        { contextName: 'customer', operator: 'IN', values: ['12', '13'] },
    ];
    const context = {
        environment: 'dev',
        properties: { customer: '13' },
    };
    t.true(strategy.isEnabled(params, context, constraints));
});
