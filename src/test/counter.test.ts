import test from 'ava';
import { Counters } from '../counter';

test('counting with different labels should be stored as different counters', (t) => {
  const counters = new Counters({
    disableCounters: false,
    timeout: 0,
    appName: 'ava-test',
    environment: 'test',
    url: 'https://example.com/api',
    counterJitter: 400,
    counterInterval: 0,
  });
  counters.count('my_counter', { test: 'value_a' });
  counters.count('my_counter', { test: 'value_b' });
  t.true(counters.createCounterData().metrics.length === 2);
});

test('counters always have app_name and environment labels', (t) => {
  const counters = new Counters({
    disableCounters: false,
    timeout: 0,
    appName: 'ava-test',
    environment: 'test',
    url: 'https://example.com/api',
    counterJitter: 400,
    counterInterval: 0,
  });
  counters.count('my_counter', { test: 'value_a' });
  counters.count('my_counter', { test: 'value_b' });
  const data = counters.createCounterData();
  for (const counter of data.metrics) {
    t.is(counter.labels.environment, 'test');
    t.is(counter.labels.app_name, 'ava-test');
  }
});

test('sanitizes label keys and values to only lowercased alphanumeric characters', (t) => {
  const counters = new Counters({
    disableCounters: false,
    timeout: 0,
    appName: 'ava-test',
    environment: 'test',
    url: 'https://example.com/api',
    counterJitter: 400,
    counterInterval: 0,
  });
  counters.count('my_counter', { 'MyCR#AZ^': 'my_counter_label_value' });
  const data = counters.createCounterData();
  t.true(data.metrics[0].labels.mycr_az === 'my_counter_label_value');
});
