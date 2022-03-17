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

// New constraint operators

test('should be enabled when email startsWith', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'email', operator: 'STR_STARTS_WITH', values: ['example'] },
  ];
  const context = {
    environment: 'dev',
    properties: { email: 'example@getunleash.ai' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when email startsWith (multiple)', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'email', operator: 'STR_STARTS_WITH', values: ['other', 'example'] },
  ];
  const context = {
    environment: 'dev',
    properties: { email: 'example@getunleash.ai' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when email endsWith', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'email', operator: 'STR_ENDS_WITH', values: ['@getunleash.ai'] },
  ];
  const context = {
    environment: 'dev',
    properties: { email: 'example@getunleash.ai' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when email endsWith, ignoring case', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [{
    contextName: 'email',
    operator: 'STR_ENDS_WITH',
    values: ['@getunleash.ai'],
    caseInsensitive: true,
  }];
  const context = {
    environment: 'dev',
    properties: { email: 'example@GETunleash.ai' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should not be enabled when email endsWith, caring about case', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'email', operator: 'STR_ENDS_WITH', values: ['@getunleash.ai'] },
  ];
  const context = {
    environment: 'dev',
    properties: { email: 'example@GETunleash.ai' },
  };
  t.false(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when email NOT endsWith (inverted)', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'email', operator: 'STR_ENDS_WITH', values: ['@getunleash.ai'], inverted: true },
  ];
  const context = {
    environment: 'dev',
    properties: { email: 'example@something-else.com' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when email endsWith (multi)', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'email', operator: 'STR_ENDS_WITH',
    values: ['@getunleash.ai', '@somerandom-email.com'] },
  ];
  const context = {
    environment: 'dev',
    properties: { email: 'example@getunleash.ai' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should not enabled when email does not endsWith', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'email', operator: 'STR_ENDS_WITH', values: ['@getunleash.ai'] },
  ];
  const context = {
    environment: 'dev',
    properties: { email: 'example@something-else.ai' },
  };
  t.false(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when email contains', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'email', operator: 'STR_CONTAINS', values: ['some'] },
  ];
  const context = {
    environment: 'dev',
    properties: { email: 'example-some@getunleash.ai' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when email does not contain (inverted)', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'email', operator: 'STR_CONTAINS', values: ['some'], inverted: true },
  ];
  const context = {
    environment: 'dev',
    properties: { email: 'example@getunleash.ai' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when someVal "equals"', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'someVal', operator: 'NUM_EQ', value: 42 },
  ];
  const context = {
    environment: 'dev',
    properties: { someVal: '42' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when someVal not "equals" (inverted)', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'someVal', operator: 'NUM_EQ', value: 42, inverted: true },
  ];
  const context = {
    environment: 'dev',
    properties: { someVal: '44' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when someVal "equals" number', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'someVal', operator: 'NUM_EQ', value: 42 },
  ];
  const context = {
    environment: 'dev',
    properties: { someVal: 42 },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when someVal "greater than" number', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'someVal', operator: 'NUM_GT', value: 42 },
  ];
  const context = {
    environment: 'dev',
    properties: { someVal: '44' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be disable when someVal is not "greater than" number', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'someVal', operator: 'NUM_GT', value: 42 },
  ];
  const context = {
    environment: 'dev',
    properties: { someVal: '42' },
  };
  t.false(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when someVal "lower than" number', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'someVal', operator: 'NUM_LT', value: 42 },
  ];
  const context = {
    environment: 'dev',
    properties: { someVal: '0' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when someVal "lower than or eq" number', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'someVal', operator: 'NUM_LTE', value: '42' },
  ];
  const context = {
    environment: 'dev',
    properties: { someVal: 42 },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when someVal "greater than or eq" number', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'someVal', operator: 'NUM_GTE', value: '42' },
  ];
  const context = {
    environment: 'dev',
    properties: { someVal: 42 },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});


test('should be enabled when date is after', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'someVal', operator: 'DATE_AFTER', value: "2022-01-29T13:00:00.000Z" },
  ];
  const context = {
    environment: 'dev',
    currentTime: new Date("2022-01-29T14:00:00.000Z"),
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be disabled when date is not after', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'someVal', operator: 'DATE_AFTER', value: "2022-01-29T13:00:00.000Z" },
  ];
  const context = {
    environment: 'dev',
    currentTime: new Date("2022-01-27T14:00:00.000Z"),
  };
  t.false(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when date is after implicit currentTime', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'someVal', operator: 'DATE_AFTER', value: new Date("2022-01-28T14:00:00.000Z")},
  ];
  const context = {
    environment: 'dev',
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when date is before', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'someVal',
    operator: 'DATE_BEFORE', value: new Date("2022-01-29T13:00:00.000Z") },
  ];
  const context = {
    environment: 'dev',
    currentTime: new Date("2022-01-27T14:00:00.000Z"),
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be disabled when date is not before', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'someVal',
    operator: 'DATE_BEFORE', value: new Date("2022-01-25T13:00:00.000Z") },
  ];
  const context = {
    environment: 'dev',
    currentTime: new Date("2022-01-27T14:00:00.000Z"),
  };
  t.false(strategy.isEnabledWithConstraints(params, context, constraints));
});


test('should be enabled when semver eq', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'version',
    operator: 'SEMVER_EQ', value: '1.2.2' },
  ];
  const context = {
    environment: 'dev',
    properties: { version: '1.2.2' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when semver lt', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'version',
    operator: 'SEMVER_LT', value: '1.2.2' },
  ];
  const context = {
    environment: 'dev',
    properties: { version: '1.2.0' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when semver gt', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'version',
    operator: 'SEMVER_GT', value: '1.2.2' },
  ];
  const context = {
    environment: 'dev',
    properties: { version: '1.2.5' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be enabled when semver in range', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'version', operator: 'SEMVER_GT', value: '1.2.2' },
    { contextName: 'version', operator: 'SEMVER_LT', value: '2.0.0' },
  ];

  const context = {
    environment: 'dev',
    properties: { version: '1.2.5' },
  };
  t.true(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be disabled when semver out of range', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'version', operator: 'SEMVER_GT', value: '1.2.2' },
    { contextName: 'version', operator: 'SEMVER_LT', value: '2.0.0' },
  ];

  const context = {
    environment: 'dev',
    properties: { version: '1.2.0' },
  };
  t.false(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should be disabled when semver larger than range', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'version', operator: 'SEMVER_GT', value: '1.2.2' },
    { contextName: 'version', operator: 'SEMVER_LT', value: '2.0.0' },
  ];

  const context = {
    environment: 'dev',
    properties: { version: '2.2.1' },
  };
  t.false(strategy.isEnabledWithConstraints(params, context, constraints));
});

test('should return false when passed an invalid semver', (t) => {
  const strategy = new Strategy('test', true);
  const params = {};
  const constraints = [
    { contextName: 'version', operator: 'SEMVER_GT', value: 'not_a_semver' },
    { contextName: 'version', operator: 'SEMVER_LT', value: 'definitely_not_a_semver' },
  ];

  const context = {
    environment: 'dev',
    properties: { version: 'also_not_a_semver' },
  };
  t.false(strategy.isEnabledWithConstraints(params, context, constraints));
})