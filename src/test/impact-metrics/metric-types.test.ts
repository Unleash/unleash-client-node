import test from 'ava';
import { ImpactMetricRegistry, MetricLabels } from '../../impact-metrics/metric-types';

test('Counter increments by default value', (t) => {
  const registry = new ImpactMetricRegistry();
  const counter = registry.counter({ name: 'test_counter', help: 'testing' });

  counter.inc();

  const result = registry.collect();
  const metric = result.find((m) => m.name === 'test_counter');

  t.is(metric?.samples.length, 1);
  t.deepEqual(metric?.samples[0].labels, {});
  t.is(metric?.samples[0].value, 1);
});

test('Counter increments with custom value and labels', (t) => {
  const registry = new ImpactMetricRegistry();
  const counter = registry.counter({ name: 'labeled_counter', help: 'with labels' });

  counter.inc(3, { foo: 'bar' });
  counter.inc(2, { foo: 'bar' });

  const result = registry.collect();
  const metric = result.find((m) => m.name === 'labeled_counter');

  t.is(metric?.samples.length, 1);
  t.deepEqual(metric?.samples[0].labels, { foo: 'bar' });
  t.is(metric?.samples[0].value, 5);
});

test('Gauge supports inc, dec, and set', (t) => {
  const registry = new ImpactMetricRegistry();
  const gauge = registry.gauge({ name: 'test_gauge', help: 'gauge test' });

  gauge.inc(5, { env: 'prod' });
  gauge.dec(2, { env: 'prod' });
  gauge.set(10, { env: 'prod' });

  const result = registry.collect();
  const metric = result.find((m) => m.name === 'test_gauge');

  t.is(metric?.samples.length, 1);
  t.deepEqual(metric?.samples[0].labels, { env: 'prod' });
  t.is(metric?.samples[0].value, 10);
});

test('Different label combinations are stored separately', (t) => {
  const registry = new ImpactMetricRegistry();
  const counter = registry.counter({ name: 'multi_label', help: 'label test' });

  counter.inc(1, { a: 'x' });
  counter.inc(2, { b: 'y' });
  counter.inc(3);

  const result = registry.collect();
  const metric = result.find((m) => m.name === 'multi_label');

  t.is(metric?.samples.length, 3);

  const lookup = (labels: MetricLabels) =>
    metric!.samples.find((s) => JSON.stringify(s.labels) === JSON.stringify(labels))?.value;

  t.is(lookup({ a: 'x' }), 1);
  t.is(lookup({ b: 'y' }), 2);
  t.is(lookup({}), 3);
});
