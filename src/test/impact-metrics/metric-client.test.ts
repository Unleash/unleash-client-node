import { MetricsAPI } from '../../impact-metrics/metric-client';

import test from 'ava';

test('should not register a counter with empty name or help', (t) => {
  let counterRegistered = false;

  const fakeRegistry = {
    counter: () => {
      counterRegistered = true;
    },
  };

  const staticContext = { appName: 'my-app', environment: 'dev' };
  const api = new MetricsAPI(fakeRegistry as any, staticContext);

  api.defineCounter('some_name', '');
  t.false(counterRegistered, 'Counter should not be registered with empty help');

  api.defineCounter('', 'some_help');
  t.false(counterRegistered, 'Counter should not be registered with empty name');
});

test('should register a counter with valid name and help', (t) => {
  let counterRegistered = false;

  const fakeRegistry = {
    counter: () => {
      counterRegistered = true;
    },
  };

  const staticContext = { appName: 'my-app', environment: 'dev' };
  const api = new MetricsAPI(fakeRegistry as any, staticContext);

  api.defineCounter('valid_name', 'Valid help text');
  t.true(counterRegistered, 'Counter should be registered with valid name and help');
});

test('should not register a gauge with empty name or help', (t) => {
  let gaugeRegistered = false;

  const fakeRegistry = {
    gauge: () => {
      gaugeRegistered = true;
    },
  };

  const staticContext = { appName: 'my-app', environment: 'dev' };
  const api = new MetricsAPI(fakeRegistry as any, staticContext);

  api.defineGauge('some_name', '');
  t.false(gaugeRegistered, 'Gauge should not be registered with empty help');

  api.defineGauge('', 'some_help');
  t.false(gaugeRegistered, 'Gauge should not be registered with empty name');
});

test('should register a gauge with valid name and help', (t) => {
  let gaugeRegistered = false;

  const fakeRegistry = {
    gauge: () => {
      gaugeRegistered = true;
    },
  };

  const staticContext = { appName: 'my-app', environment: 'dev' };
  const api = new MetricsAPI(fakeRegistry as any, staticContext);

  api.defineGauge('valid_name', 'Valid help text');
  t.true(gaugeRegistered, 'Gauge should be registered with valid name and help');
});

test('should increment counter with valid parameters', (t) => {
  let counterIncremented = false;

  const fakeCounter = {
    inc: () => {
      counterIncremented = true;
    },
  };

  const fakeRegistry = {
    getCounter: () => fakeCounter,
  };

  const staticContext = { appName: 'my-app', environment: 'dev' };
  const api = new MetricsAPI(fakeRegistry as any, staticContext);

  api.incrementCounter('valid_counter', 5, 'featureX');
  t.true(counterIncremented, 'Counter should be incremented with valid parameters');
});

test('should set gauge with valid parameters', (t) => {
  let gaugeSet = false;

  const fakeGauge = {
    set: () => {
      gaugeSet = true;
    },
  };

  const fakeRegistry = {
    getGauge: () => fakeGauge,
  };

  const staticContext = { appName: 'my-app', environment: 'dev' };
  const api = new MetricsAPI(fakeRegistry as any, staticContext);

  api.updateGauge('valid_gauge', 10, 'featureY');
  t.true(gaugeSet, 'Gauge should be set with valid parameters');
});

test('defining a counter automatically sets label names', (t) => {
  let counterRegistered = false;

  const fakeRegistry = {
    counter: (config: any) => {
      counterRegistered = true;
      t.deepEqual(
        config.labelNames,
        ['featureName', 'appName', 'environment'],
        'Label names should be set correctly',
      );
    },
  };

  const staticContext = { appName: 'my-app', environment: 'dev' };
  const api = new MetricsAPI(fakeRegistry as any, staticContext);

  api.defineCounter('test_counter', 'Test help text');
  t.true(counterRegistered, 'Counter should be registered');
});

test('defining a gauge automatically sets label names', (t) => {
  let gaugeRegistered = false;

  const fakeRegistry = {
    gauge: (config: any) => {
      gaugeRegistered = true;
      t.deepEqual(
        config.labelNames,
        ['featureName', 'appName', 'environment'],
        'Label names should be set correctly',
      );
    },
  };

  const staticContext = { appName: 'my-app', environment: 'dev' };
  const api = new MetricsAPI(fakeRegistry as any, staticContext);

  api.defineGauge('test_gauge', 'Test help text');
  t.true(gaugeRegistered, 'Gauge should be registered');
});
