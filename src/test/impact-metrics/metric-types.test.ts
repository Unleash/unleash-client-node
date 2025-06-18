import test from 'ava';
import { InMemoryMetricRegistry } from '../../impact-metrics/metric-types';

test('Counter increments by default value', (t) => {
  const registry = new InMemoryMetricRegistry();
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
  const registry = new InMemoryMetricRegistry();
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
  const registry = new InMemoryMetricRegistry();
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
  const registry = new InMemoryMetricRegistry();
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
  const registry = new InMemoryMetricRegistry();
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

test('collect returns empty array when all metrics are empty', (t) => {
  const registry = new InMemoryMetricRegistry();
  registry.counter({ name: 'noop_counter', help: 'noop' });
  registry.gauge({ name: 'noop_gauge', help: 'noop' });

  const result = registry.collect();
  t.deepEqual(result, []);
});

test('collect returns empty array after flushing previous values', (t) => {
  const registry = new InMemoryMetricRegistry();
  const counter = registry.counter({ name: 'flush_test', help: 'flush' });

  counter.inc(1);
  const first = registry.collect();
  t.truthy(first);
  t.is(first.length, 1);

  const second = registry.collect();
  t.deepEqual(second, []);
});

test('restore reinserts collected metrics into the registry', (t) => {
  const registry = new InMemoryMetricRegistry();
  const counter = registry.counter({ name: 'restore_test', help: 'testing restore' });

  counter.inc(5, { tag: 'a' });
  counter.inc(2, { tag: 'b' });

  const flushed = registry.collect();
  t.is(flushed.length, 1);

  const afterFlush = registry.collect();
  t.deepEqual(afterFlush, []);

  registry.restore(flushed);

  const restored = registry.collect();
  t.deepEqual(restored, [
    {
      name: 'restore_test',
      help: 'testing restore',
      type: 'counter',
      samples: [
        { labels: { tag: 'a' }, value: 5 },
        { labels: { tag: 'b' }, value: 2 },
      ],
    },
  ]);
});
