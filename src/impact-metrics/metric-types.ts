type MetricType = 'counter' | 'gauge';
type LabelValuesKey = string;

function getLabelKey(labels?: MetricLabels): LabelValuesKey {
  if (!labels) return '';
  return Object.keys(labels)
    .sort()
    .map((k) => `${k}=${labels[k]}`)
    .join(',');
}

function parseLabelKey(key: string): MetricLabels {
  const labels: MetricLabels = {};
  if (!key) return labels;
  for (const pair of key.split(',')) {
    const [k, v] = pair.split('=');
    labels[k] = v;
  }
  return labels;
}

export interface MetricSample {
  labels: MetricLabels;
  value: number;
}

export interface CollectedMetric {
  name: string;
  help: string;
  type: MetricType;
  samples: MetricSample[];
}

interface CollectibleMetric {
  collect(): CollectedMetric;
}

class CounterImpl implements Counter {
  private values = new Map<LabelValuesKey, number>();

  constructor(private opts: MetricOptions) {}

  inc(value?: number, labels?: MetricLabels): void {
    const delta = value ?? 1;
    const key = getLabelKey(labels);
    const current = this.values.get(key) ?? 0;
    this.values.set(key, current + delta);
  }

  collect(): CollectedMetric {
    const samples = [...this.values.entries()].map(([key, value]) => ({
      labels: parseLabelKey(key),
      value,
    }));

    this.values.clear();

    return {
      name: this.opts.name,
      help: this.opts.help,
      type: 'counter',
      samples,
    };
  }
}

class GaugeImpl implements Gauge {
  private values = new Map<LabelValuesKey, number>();

  constructor(private opts: MetricOptions) {}

  inc(value?: number, labels?: MetricLabels): void {
    const delta = value ?? 1;
    const key = getLabelKey(labels);
    const current = this.values.get(key) ?? 0;
    this.values.set(key, current + delta);
  }

  dec(value?: number, labels?: MetricLabels): void {
    const delta = value ?? 1;
    const key = getLabelKey(labels);
    const current = this.values.get(key) ?? 0;
    this.values.set(key, current - delta);
  }

  set(value: number, labels?: MetricLabels): void {
    const key = getLabelKey(labels);
    this.values.set(key, value);
  }

  collect(): CollectedMetric {
    const samples = [...this.values.entries()].map(([key, value]) => ({
      labels: parseLabelKey(key),
      value,
    }));

    this.values.clear();

    return {
      name: this.opts.name,
      help: this.opts.help,
      type: 'gauge',
      samples,
    };
  }
}

export type MetricLabels = Record<string, string>;

export interface Counter {
  inc(value?: number, labels?: MetricLabels): void;
}

export interface Gauge {
  inc(value?: number, labels?: MetricLabels): void;
  dec(value?: number, labels?: MetricLabels): void;
  set(value: number, labels?: MetricLabels): void;
}

export interface ImpactMetricsDataSource {
  collect(): CollectedMetric[];
  restore(metrics: CollectedMetric[]): void;
}

export interface ImpactMetricRegistry {
  getCounter(counterName: string): Counter | undefined;
  getGauge(gaugeName: string): Gauge | undefined;
  counter(opts: MetricOptions): Counter;
  gauge(opts: MetricOptions): Gauge;
}

export class InMemoryMetricRegistry implements ImpactMetricsDataSource, ImpactMetricRegistry {
  private counters = new Map<string, Counter & CollectibleMetric>();

  private gauges = new Map<string, Gauge & CollectibleMetric>();

  getCounter(counterName: string): Counter | undefined {
    return this.counters.get(counterName);
  }

  getGauge(gaugeName: string): Gauge | undefined {
    return this.gauges.get(gaugeName);
  }

  counter(opts: MetricOptions): Counter {
    const key = opts.name;
    if (!this.counters.has(key)) {
      this.counters.set(key, new CounterImpl(opts));
    }
    return this.counters.get(key)!;
  }

  gauge(opts: MetricOptions): Gauge {
    const key = opts.name;
    if (!this.gauges.has(key)) {
      this.gauges.set(key, new GaugeImpl(opts));
    }
    return this.gauges.get(key)!;
  }

  collect(): CollectedMetric[] {
    const allCounters = [...this.counters.values()].map((c) => c.collect());
    const allGauges = [...this.gauges.values()].map((g) => g.collect());
    const allMetrics = [...allCounters, ...allGauges];

    const nonEmpty = allMetrics.filter((metric) => metric.samples.length > 0);
    return nonEmpty.length > 0 ? nonEmpty : [];
  }

  restore(metrics: CollectedMetric[]): void {
    for (const metric of metrics) {
      switch (metric.type) {
        case 'counter': {
          const counter = this.counter({ name: metric.name, help: metric.help });
          for (const sample of metric.samples) {
            counter.inc(sample.value, sample.labels);
          }
          break;
        }

        case 'gauge': {
          const gauge = this.gauge({ name: metric.name, help: metric.help });
          for (const sample of metric.samples) {
            gauge.set(sample.value, sample.labels);
          }
          break;
        }
      }
    }
  }
}

export interface MetricOptions {
  name: string;
  help: string;
  labelNames?: string[];
}
