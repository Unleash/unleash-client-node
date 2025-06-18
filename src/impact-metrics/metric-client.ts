import { EventEmitter } from 'stream';
import { StaticContext, Unleash, UnleashEvents } from '../unleash';
import { ImpactMetricRegistry } from './metric-types';

export class MetricsAPI extends EventEmitter {
  constructor(
    private metricRegistry: ImpactMetricRegistry,
    private staticContext: StaticContext,
  ) {
    super();
  }

  defineCounter(name: string, help: string) {
    if (!name || !help) {
      this.emit(UnleashEvents.Warn, `Counter name or help cannot be empty: ${name}, ${help}.`);
      return;
    }
    const labelNames = ['featureName', 'appName', 'environment'];
    this.metricRegistry.counter({ name, help, labelNames });
  }

  defineGauge(name: string, help: string) {
    if (!name || !help) {
      this.emit(UnleashEvents.Warn, `Counter name or help cannot be empty: ${name}, ${help}.`);
      return;
    }
    const labelNames = ['featureName', 'appName', 'environment'];
    this.metricRegistry.gauge({ name, help, labelNames });
  }

  incrementCounter(name: string, value?: number, featureName?: string): void {
    const counter = this.metricRegistry.getCounter(name);
    if (!counter) {
      this.emit(
        UnleashEvents.Warn,
        `Counter ${name} not defined, this counter will not be incremented.`,
      );
      return;
    }

    const labels = {
      ...(featureName ? { featureName } : {}),
      ...this.staticContext,
    };

    counter.inc(value, labels);
  }

  updateGauge(name: string, value: number, featureName?: string): void {
    const gauge = this.metricRegistry.getGauge(name);
    if (!gauge) {
      this.emit(UnleashEvents.Warn, `Gauge ${name} not defined, this gauge will not be updated.`);
      return;
    }

    const labels = {
      ...(featureName ? { featureName } : {}),
      ...this.staticContext,
    };

    gauge.set(value, labels);
  }
}

export class UnleashMetricClient extends Unleash {
  public impactMetrics: MetricsAPI;

  constructor(...args: ConstructorParameters<typeof Unleash>) {
    super(...args);
    this.impactMetrics = new MetricsAPI(this.metricRegistry, this.staticContext);
  }
}
