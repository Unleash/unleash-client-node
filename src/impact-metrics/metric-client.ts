import { EventEmitter } from 'stream';
import { StaticContext, Unleash, UnleashEvents } from '../unleash';
import { ImpactMetricRegistry, MetricFlagContext, MetricLabels } from './metric-types';
import { extractEnvironmentFromCustomHeaders } from './environment-resolver';
import Client from '../client';

export class MetricsAPI extends EventEmitter {
  constructor(
    private metricRegistry: ImpactMetricRegistry,
    private client: Pick<Client, 'forceGetVariant'>,
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
      this.emit(UnleashEvents.Warn, `Gauge name or help cannot be empty: ${name}, ${help}.`);
      return;
    }
    const labelNames = ['featureName', 'appName', 'environment'];
    this.metricRegistry.gauge({ name, help, labelNames });
  }

  private getFlagLabels(flagContext?: MetricFlagContext): MetricLabels {
    let flagLabels: MetricLabels = {};
    if (flagContext) {
      for (const flag of flagContext.flagNames) {
        const variant = this.client.forceGetVariant(flag, flagContext.context);

        if (variant.name !== 'disabled') {
          flagLabels[flag] = variant.name;
        } else if (variant.feature_enabled) {
          flagLabels[flag] = 'enabled';
        } else {
          flagLabels[flag] = 'disabled';
        }
      }
    }
    return flagLabels;
  }

  incrementCounter(name: string, value?: number, flagContext?: MetricFlagContext): void {
    const counter = this.metricRegistry.getCounter(name);
    if (!counter) {
      this.emit(
        UnleashEvents.Warn,
        `Counter ${name} not defined, this counter will not be incremented.`,
      );
      return;
    }

    const flagLabels = this.getFlagLabels(flagContext);

    const labels = {
      ...flagLabels,
      ...this.staticContext,
    };

    counter.inc(value, labels);
  }

  updateGauge(name: string, value: number, flagContext?: MetricFlagContext): void {
    const gauge = this.metricRegistry.getGauge(name);
    if (!gauge) {
      this.emit(UnleashEvents.Warn, `Gauge ${name} not defined, this gauge will not be updated.`);
      return;
    }

    const flagLabels = this.getFlagLabels(flagContext);

    const labels = {
      ...flagLabels,
      ...this.staticContext,
    };

    gauge.set(value, labels);
  }
}

export class UnleashMetricClient extends Unleash {
  public impactMetrics: MetricsAPI;

  constructor(...args: ConstructorParameters<typeof Unleash>) {
    super(...args);

    const config = args[0];
    const metricsContext: StaticContext = { ...this.staticContext };

    if (config && config.customHeaders) {
      const environment = extractEnvironmentFromCustomHeaders(config.customHeaders);
      if (environment) {
        metricsContext.environment = environment;
      }
    }

    this.impactMetrics = new MetricsAPI(this.metricRegistry, this.client, metricsContext);
  }
}
