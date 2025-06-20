import { tmpdir } from 'os';
import { EventEmitter } from 'events';
import Client from './client';
import Repository, { RepositoryInterface, SUPPORTED_SPEC_VERSION } from './repository';
import Metrics from './metrics';
import { Context } from './context';
import { Strategy, defaultStrategies } from './strategy';

import { EnhancedFeatureInterface, FeatureInterface } from './feature';
import { Variant, defaultVariant, VariantWithFeatureStatus } from './variant';
import {
  FallbackFunction,
  createFallbackFunction,
  generateInstanceId,
  generateHashOfConfig,
} from './helpers';
import { resolveBootstrapProvider } from './repository/bootstrap-provider';
import { ImpressionEvent, UnleashEvents } from './events';
import { UnleashConfig } from './unleash-config';
import FileStorageProvider from './repository/storage-provider-file';
import { resolveUrl } from './url-utils';
import { EventSource } from './event-source';
import { buildHeaders } from './request';
import { uuidv4 } from './uuidv4';
import { InMemoryMetricRegistry } from './impact-metrics/metric-types';
export { Strategy, UnleashEvents, UnleashConfig };

const BACKUP_PATH: string = tmpdir();

export interface StaticContext {
  appName: string;
  environment: string;
}

export class Unleash extends EventEmitter {
  private static configSignature?: string;

  private static instance?: Unleash;

  private static instanceCount: number = 0;

  private repository: RepositoryInterface;

  private client: Client;

  private metrics: Metrics;

  protected staticContext: StaticContext;

  private synchronized: boolean = false;

  private ready: boolean = false;

  private started: boolean = false;

  protected metricRegistry = new InMemoryMetricRegistry();

  constructor({
    appName,
    environment = 'default',
    projectName,
    instanceId,
    url,
    refreshInterval = 15 * 1000,
    metricsInterval = 60 * 1000,
    metricsJitter = 0,
    disableMetrics = false,
    backupPath = BACKUP_PATH,
    strategies = [],
    repository,
    namePrefix,
    customHeaders,
    customHeadersFunction,
    timeout,
    httpOptions,
    tags,
    bootstrap = {},
    bootstrapOverride,
    storageProvider,
    disableAutoStart = false,
    skipInstanceCountWarning = false,
    experimentalMode = { type: 'polling', format: 'full' },
  }: UnleashConfig) {
    super();

    Unleash.instanceCount++;

    this.on(UnleashEvents.Error, (error) => {
      // Only if there does not exist other listeners for this event.
      if (this.listenerCount(UnleashEvents.Error) === 1) {
        console.error(error);
      }
    });

    if (!skipInstanceCountWarning && Unleash.instanceCount > 10) {
      process.nextTick(() => {
        const error = new Error('The unleash SDK has been initialized more than 10 times');
        this.emit(UnleashEvents.Error, error);
      });
    }

    if (!url) {
      throw new Error('Unleash API "url" is required');
    }
    if (!appName) {
      throw new Error('Unleash client "appName" is required');
    }

    const unleashUrl = this.cleanUnleashUrl(url);

    const unleashInstanceId = generateInstanceId(instanceId);

    const unleashConnectionId = uuidv4();

    this.staticContext = { appName, environment };

    const bootstrapProvider = resolveBootstrapProvider(bootstrap, appName, unleashInstanceId);

    this.repository =
      repository ||
      new Repository({
        projectName,
        url: unleashUrl,
        appName,
        instanceId: unleashInstanceId,
        connectionId: unleashConnectionId,
        refreshInterval,
        headers: customHeaders,
        customHeadersFunction,
        timeout,
        httpOptions,
        namePrefix,
        tags,
        bootstrapProvider,
        bootstrapOverride,
        mode: experimentalMode,
        eventSource:
          experimentalMode?.type === 'streaming'
            ? new EventSource(resolveUrl(unleashUrl, './client/streaming'), {
                headers: buildHeaders({
                  appName,
                  instanceId: unleashInstanceId,
                  etag: undefined,
                  contentType: undefined,
                  custom: customHeaders,
                  specVersionSupported: SUPPORTED_SPEC_VERSION,
                  connectionId: unleashConnectionId,
                }),
                readTimeoutMillis: 60000, // start a new SSE connection when no heartbeat received in 1 minute
                initialRetryDelayMillis: 2000,
                maxBackoffMillis: 30000,
                retryResetIntervalMillis: 60000,
                jitterRatio: 0.5,
                errorFilter: function () {
                  // retry all errors
                  return true;
                },
              })
            : undefined,
        storageProvider: storageProvider || new FileStorageProvider(backupPath),
      });

    this.repository.on(UnleashEvents.Ready, () => {
      this.ready = true;
      process.nextTick(() => {
        this.emit(UnleashEvents.Ready);
      });
    });

    this.repository.on(UnleashEvents.Error, (err) => {
      // eslint-disable-next-line no-param-reassign
      err.message = `Unleash Repository error: ${err.message}`;
      this.emit(UnleashEvents.Error, err);
    });

    this.repository.on(UnleashEvents.Warn, (msg) => this.emit(UnleashEvents.Warn, msg));

    this.repository.on(UnleashEvents.Unchanged, (msg) => this.emit(UnleashEvents.Unchanged, msg));

    this.repository.on(UnleashEvents.Changed, (data) => {
      this.emit(UnleashEvents.Changed, data);

      // Only emit the fully synchronized event the first time.
      if (!this.synchronized) {
        this.synchronized = true;
        process.nextTick(() => this.emit(UnleashEvents.Synchronized));
      }
    });

    // setup client
    const supportedStrategies = strategies.concat(defaultStrategies);
    this.client = new Client(this.repository, supportedStrategies);
    this.client.on(UnleashEvents.Error, (err) => this.emit(UnleashEvents.Error, err));
    this.client.on(UnleashEvents.Impression, (e: ImpressionEvent) =>
      this.emit(UnleashEvents.Impression, e),
    );

    this.metrics = new Metrics({
      disableMetrics,
      appName,
      instanceId: unleashInstanceId,
      connectionId: unleashConnectionId,
      strategies: supportedStrategies.map((strategy: Strategy) => strategy.name),
      metricsInterval,
      metricsJitter,
      url: unleashUrl,
      headers: customHeaders,
      customHeadersFunction,
      timeout,
      httpOptions,
      metricRegistry: this.metricRegistry,
    });

    this.metrics.on(UnleashEvents.Error, (err) => {
      // eslint-disable-next-line no-param-reassign
      err.message = `Unleash Metrics error: ${err.message}`;
      this.emit(UnleashEvents.Error, err);
    });

    this.metrics.on(UnleashEvents.Warn, (msg) => this.emit(UnleashEvents.Warn, msg));
    this.metrics.on(UnleashEvents.Sent, (payload) => this.emit(UnleashEvents.Sent, payload));

    this.metrics.on(UnleashEvents.Count, (name, enabled) => {
      this.emit(UnleashEvents.Count, name, enabled);
    });
    this.metrics.on(UnleashEvents.Registered, (payload) => {
      this.emit(UnleashEvents.Registered, payload);
    });

    if (!disableAutoStart) {
      process.nextTick(async () => this.start());
    }
  }

  /**
   * Will only give you an instance the first time you call the method,
   * and then return the same instance.
   * @param config The Unleash Config.
   * @returns the Unleash instance
   */
  static getInstance(config: UnleashConfig) {
    const cleanConfig = {
      ...config,
      // Remove complex objects
      repository: undefined,
      customHeadersFunction: undefined,
      storageProvider: undefined,
    };
    const configSignature = generateHashOfConfig(cleanConfig);
    if (Unleash.instance) {
      if (configSignature !== Unleash.configSignature) {
        throw new Error('You already have an Unleash instance with a different configuration.');
      }
      return Unleash.instance;
    }
    const instance = new Unleash(config);
    Unleash.instance = instance;
    Unleash.configSignature = configSignature;
    return instance;
  }

  private cleanUnleashUrl(url: string): string {
    let unleashUrl = url;
    if (unleashUrl.endsWith('/features')) {
      const oldUrl = unleashUrl;
      process.nextTick(() =>
        this.emit(
          UnleashEvents.Warn,
          `Unleash server URL "${oldUrl}" should no longer link directly to /features`,
        ),
      );
      unleashUrl = unleashUrl.replace(/\/features$/, '');
    }

    if (!unleashUrl.endsWith('/')) {
      unleashUrl += '/';
    }
    return unleashUrl;
  }

  isSynchronized() {
    return this.synchronized;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    await Promise.all([this.repository.start(), this.metrics.start()]);
  }

  destroy() {
    this.repository.stop();
    this.metrics.stop();
    Unleash.instance = undefined;
    Unleash.configSignature = undefined;
    Unleash.instanceCount--;
  }

  isEnabled(name: string, context?: Context, fallbackFunction?: FallbackFunction): boolean;
  isEnabled(name: string, context?: Context, fallbackValue?: boolean): boolean;
  isEnabled(name: string, context: Context = {}, fallback?: FallbackFunction | boolean): boolean {
    const enhancedContext = { ...this.staticContext, ...context };
    const fallbackFunc = createFallbackFunction(name, enhancedContext, fallback);

    let result;
    if (this.ready) {
      result = this.client.isEnabled(name, enhancedContext, fallbackFunc);
    } else {
      result = fallbackFunc();
      this.emit(
        UnleashEvents.Warn,
        `Unleash has not been initialized yet. isEnabled(${name}) defaulted to ${result}`,
      );
    }
    this.count(name, result);
    return result;
  }

  getVariant(
    name: string,
    context: Context = {},
    fallbackVariant?: Variant,
  ): VariantWithFeatureStatus {
    const enhancedContext = { ...this.staticContext, ...context };
    let variant: VariantWithFeatureStatus;
    if (this.ready) {
      variant = this.client.getVariant(name, enhancedContext, fallbackVariant);
    } else {
      variant =
        typeof fallbackVariant !== 'undefined'
          ? { ...fallbackVariant, feature_enabled: false, featureEnabled: false }
          : { ...defaultVariant, featureEnabled: defaultVariant.feature_enabled! };
      this.emit(
        UnleashEvents.Warn,
        `Unleash has not been initialized yet. isEnabled(${name}) defaulted to ${variant}`,
      );
    }

    if (variant.name) {
      this.countVariant(name, variant.name);
    }

    this.count(name, Boolean(variant.feature_enabled));

    return variant;
  }

  forceGetVariant(name: string, context: Context = {}, fallbackVariant?: Variant): Variant {
    const enhancedContext = { ...this.staticContext, ...context };
    let variant: Variant;
    if (this.ready) {
      variant = this.client.forceGetVariant(name, enhancedContext, fallbackVariant);
    } else {
      variant =
        typeof fallbackVariant !== 'undefined'
          ? { ...fallbackVariant, feature_enabled: false }
          : defaultVariant;
      this.emit(
        UnleashEvents.Warn,
        `Unleash has not been initialized yet. isEnabled(${name}) defaulted to ${variant}`,
      );
    }
    if (variant.name) {
      this.countVariant(name, variant.name);
    }
    this.count(name, variant.feature_enabled || false);

    return variant;
  }

  getFeatureToggleDefinition(toggleName: string): FeatureInterface | undefined {
    return this.repository.getToggle(toggleName);
  }

  getFeatureToggleDefinitions(): Array<FeatureInterface>;
  getFeatureToggleDefinitions(withFullSegments: true): Array<EnhancedFeatureInterface>;
  getFeatureToggleDefinitions(
    withFullSegments?: any,
  ): Array<FeatureInterface | EnhancedFeatureInterface> {
    if (withFullSegments === true) {
      return this.repository.getTogglesWithSegmentData();
    }
    return this.repository.getToggles();
  }

  count(toggleName: string, enabled: boolean) {
    this.metrics.count(toggleName, enabled);
  }

  countVariant(toggleName: string, variantName: string) {
    this.metrics.countVariant(toggleName, variantName);
  }

  flushMetrics(): Promise<void> {
    return this.metrics.sendMetrics();
  }

  async destroyWithFlush(): Promise<void> {
    await this.flushMetrics();
    this.destroy();
  }
}
