import { Unleash } from '../unleash';

function forwardMethods<T extends object>(target: T, source: T, methodNames: (keyof T)[]) {
  for (const name of methodNames) {
    // @ts-ignore
    target[name] = (...args: any[]) => source[name](...args);
  }
}

export class UnleashMetricClient {
  private backingInstance: Unleash;

  constructor(unleash: Unleash) {
    this.backingInstance = unleash;
    forwardMethods(this, this.backingInstance as any, [
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

  isEnabled!: Unleash['isEnabled'];

  getVariant!: Unleash['getVariant'];

  forceGetVariant!: Unleash['forceGetVariant'];

  getFeatureToggleDefinition!: Unleash['getFeatureToggleDefinition'];

  getFeatureToggleDefinitions!: Unleash['getFeatureToggleDefinitions'];

  count!: Unleash['count'];

  countVariant!: Unleash['countVariant'];

  flushMetrics!: Unleash['flushMetrics'];

  destroyWithFlush!: Unleash['destroyWithFlush'];

  on!: Unleash['on'];

  start!: Unleash['start'];

  destroy!: Unleash['destroy'];

  isSynchronized!: Unleash['isSynchronized'];
}
