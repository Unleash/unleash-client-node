import { Unleash } from './unleash';

function forwardMethods<T extends object>(
  target: UnleashMetricClient,
  source: Unleash,
  methodNames: (keyof T)[],
) {
  for (const name of methodNames) {
    // @ts-ignore
    target[name] = (...args: any[]) => source[name](...args);
  }
}

export class UnleashMetricClient {
  private backingInstance: Unleash;

  constructor(unleash: Unleash) {
    this.backingInstance = unleash;
    forwardMethods(this, this.backingInstance, [
      'isEnabled',
      'getVariant',
      'forceGetVariant',
      'getFeatureToggleDefinition',
      'getFeatureToggleDefinitions',
      'count',
      'countVariant',
      'flushMetrics',
      'destroyWithFlush',
      'on',
      'start',
      'destroy',
      'isSynchronized',
    ]);
  }
}
