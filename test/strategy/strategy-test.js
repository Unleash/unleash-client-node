import test from 'ava';

import { Strategy } from '../../lib/strategy/strategy';

test('should be enabled', (t) => {
  const strategy = new Strategy('test', true);
  t.true(strategy.isEnabled());
});

test('should be enabled for environment=dev', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [{ contextName: 'environment', operator: 'IN', values: ['stage', 'dev'] }];
  const context = { environment: 'dev' };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should NOT be enabled for environment=prod', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [{ contextName: 'environment', operator: 'IN', values: ['dev'] }];
  const context = { environment: 'prod' };
  t.false(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should NOT be enabled for environment=prod AND userId=123', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'environment', operator: 'IN', values: ['dev'] },
    { contextName: 'userId', operator: 'IN', values: ['123'] },
  ];
  const context = { environment: 'prod', userId: '123' };
  t.false(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should NOT be enabled for environment=dev and strategy return false', (t) => {
  const strategy = new Strategy('test', false);
  const params = {};
  const constraints = [{ contextName: 'environment', operator: 'IN', values: ['dev'] }];
  const context = { environment: 'dev', userId: '123' };
  t.false(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when constraints is empty list', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [];
  const context = { environment: 'dev', userId: '123' };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when constraints is undefined', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = undefined;
  const context = { environment: 'dev', userId: '123' };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when environment NOT_IN constaints', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'environment', operator: 'NOT_IN', values: ['dev', 'stage'] },
  ];
  const context = { environment: 'local', userId: '123' };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should not enabled for multiple constraints where last one is not satisfied', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'environment', operator: 'NOT_IN', values: ['dev', 'stage'] },
    { contextName: 'environment', operator: 'IN', values: ['prod'] },
  ];
  const context = { environment: 'local', userId: '123' };
  t.false(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should not enabled for multiple constraints where all are satisfied', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'environment', operator: 'NOT_IN', values: ['dev', 'stage'] },
    { contextName: 'environment', operator: 'IN', values: ['prod'] },
    { contextName: 'userId', operator: 'IN', values: ['123', '223'] },
    { contextName: 'appName', operator: 'IN', values: ['web'] },
  ];
  const context = { environment: 'prod', userId: '123', appName: 'web' };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when cosutomerId is in constraint', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'environment', operator: 'IN', values: ['dev', 'stage'] },
    { contextName: 'customer', operator: 'IN', values: ['12', '13'] },
  ];
  const context = {
    environment: 'dev',
    properties: { customer: '13' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});
