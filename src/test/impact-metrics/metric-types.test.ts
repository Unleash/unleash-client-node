import test from 'ava';
import { ImpactMetricRegistry } from '../../impact-metrics/metric-types';

test('Counter increments by default value', (t) => {
  const registry = new ImpactMetricRegistry();
  const counter = registry.counter({ name: 'test_counter', help: 'testing' });

  counter.inc();

  const result = registry.collect();
  const metric = result.find((m) => m.name === 'test_counter');

  t.deepEqual(metric, {
    name: 'test_counter',
    help: 'testing',
    type: 'counter',
    samples: [
      {
        labels: {},
        value: 1,
      },
    ],
  });
});

test('Counter increments with custom value and labels', (t) => {
  const registry = new ImpactMetricRegistry();
  const counter = registry.counter({ name: 'labeled_counter', help: 'with labels' });

  counter.inc(3, { foo: 'bar' });
  counter.inc(2, { foo: 'bar' });

  const result = registry.collect();
  const metric = result.find((m) => m.name === 'labeled_counter');

  t.deepEqual(metric, {
    name: 'labeled_counter',
    help: 'with labels',
    type: 'counter',
    samples: [
      {
        labels: { foo: 'bar' },
        value: 5,
      },
    ],
  });
});

test('Gauge supports inc, dec, and set', (t) => {
  const registry = new ImpactMetricRegistry();
  const gauge = registry.gauge({ name: 'test_gauge', help: 'gauge test' });

  gauge.inc(5, { env: 'prod' });
  gauge.dec(2, { env: 'prod' });
  gauge.set(10, { env: 'prod' });

  const result = registry.collect();
  const metric = result.find((m) => m.name === 'test_gauge');

  t.deepEqual(metric, {
    name: 'test_gauge',
    help: 'gauge test',
    type: 'gauge',
    samples: [
      {
        labels: { env: 'prod' },
        value: 10,
      },
    ],
  });
});

test('Different label combinations are stored separately', (t) => {
  const registry = new ImpactMetricRegistry();
  const counter = registry.counter({ name: 'multi_label', help: 'label test' });

  counter.inc(1, { a: 'x' });
  counter.inc(2, { b: 'y' });
  counter.inc(3);

  const result = registry.collect();
  const metric = result.find((m) => m.name === 'multi_label');

  t.deepEqual(metric, {
    name: 'multi_label',
    help: 'label test',
    type: 'counter',
    samples: [
      { labels: { a: 'x' }, value: 1 },
      { labels: { b: 'y' }, value: 2 },
      { labels: {}, value: 3 },
    ],
  });
});

test('Gauge tracks values separately per label set', (t) => {
  const registry = new ImpactMetricRegistry();
  const gauge = registry.gauge({ name: 'multi_env_gauge', help: 'tracks multiple envs' });

  gauge.inc(5, { env: 'prod' });
  gauge.dec(2, { env: 'dev' });
  gauge.set(10, { env: 'test' });

  const result = registry.collect();
  const metric = result.find((m) => m.name === 'multi_env_gauge');

  t.deepEqual(metric, {
    name: 'multi_env_gauge',
    help: 'tracks multiple envs',
    type: 'gauge',
    samples: [
      { labels: { env: 'prod' }, value: 5 },
      { labels: { env: 'dev' }, value: -2 },
      { labels: { env: 'test' }, value: 10 },
    ],
  });
});
