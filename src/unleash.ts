import { tmpdir, userInfo, hostname } from 'os';
import { EventEmitter } from 'events';
import Client from './client';
import Repository, { RepositoryInterface } from './repository';
import Metrics from './metrics';
import { CustomHeaders, CustomHeadersFunction } from './headers';
import { Context } from './context';
import { Strategy, defaultStrategies } from './strategy';

import { FeatureInterface } from './feature';
import { Variant, getDefaultVariant } from './variant';
import { FallbackFunction, createFallbackFunction } from './helpers';
import { HttpOptions } from './http-options';
import { TagFilter } from './tags';
import { BootstrapOptions, resolveBootstrapProvider } from './repository/bootstrap-provider';
import { FileStorageProvider } from './repository/storage-provider';
import { UnleashEvents } from './events';

export { Strategy, UnleashEvents };

const BACKUP_PATH: string = tmpdir();

export interface UnleashConfig {
  appName: string;
  environment?: string;
  instanceId?: string;
  url: string;
  refreshInterval?: number;
  projectName?: string;
  metricsInterval?: number;
  namePrefix?: string;
  disableMetrics?: boolean;
  backupPath?: string;
  strategies?: Strategy[];
  customHeaders?: CustomHeaders;
  customHeadersFunction?: CustomHeadersFunction;
  timeout?: number;
  repository?: RepositoryInterface;
  httpOptions?: HttpOptions;
  tags?: Array<TagFilter>;
  bootstrap?: BootstrapOptions;
  disableAutoStart?: boolean;
}

export interface StaticContext {
  appName: string;
  environment: string;
}

export class Unleash extends EventEmitter {
  private repository: RepositoryInterface;

  private client: Client | undefined;

  private metrics: Metrics;

  private staticContext: StaticContext;

  private synchronized: boolean = false;

  constructor({
    appName,
    environment = 'default',
    projectName,
    instanceId,
    url,
    refreshInterval = 15 * 1000,
    metricsInterval = 60 * 1000,
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
    disableAutoStart = false,
  }: UnleashConfig) {
    super();

    if (!url) {
      throw new Error('Unleash API "url" is required');
    }
    if (!appName) {
      throw new Error('Unleash client "appName" is required');
    }
    
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

    

    let unleashInstanceId = instanceId;
    if (!unleashInstanceId) {
      let info;
      try {
        info = userInfo();
      } catch (e) {
        // unable to read info;
      }

      const prefix = info
        ? info.username
        : `generated-${Math.round(Math.random() * 1000000)}-${process.pid}`;
      unleashInstanceId = `${prefix}-${hostname()}`;
    }

    this.staticContext = { appName, environment };

    const bootstrapProvider = resolveBootstrapProvider(bootstrap, appName, unleashInstanceId);

    this.repository =
      repository ||
      new Repository({
        projectName,
        url: unleashUrl,
        appName,
        instanceId: unleashInstanceId,
        refreshInterval,
        headers: customHeaders,
        customHeadersFunction,
        timeout,
        httpOptions,
        namePrefix,
        tags,
        bootstrapProvider,
        storageProvider: new FileStorageProvider({ backupPath }),
      });

    const supportedStrategies = strategies.concat(defaultStrategies);

    this.repository.on(UnleashEvents.Ready, () => {
      this.client = new Client(this.repository, supportedStrategies);
      this.client.on(UnleashEvents.Error, (err) => this.emit(UnleashEvents.Error, err));
      this.client.on(UnleashEvents.Warn, (msg) => this.emit(UnleashEvents.Warn, msg));
      process.nextTick(() => {
        this.emit(UnleashEvents.Ready);
      });
    });

    this.repository.on(UnleashEvents.Error, (err) => {
      // eslint-disable-next-line no-param-reassign
      err.message = `Unleash Repository error: ${err.message}`;
      this.emit(UnleashEvents.Error, err);
    });

    this.repository.on(UnleashEvents.Warn, (msg) => {
      this.emit(UnleashEvents.Warn, msg);
    });

    this.repository.on(UnleashEvents.Unchanged, () => {
      this.emit(UnleashEvents.Unchanged);
    });

    this.repository.on(UnleashEvents.Changed, (data) => {
      this.emit(UnleashEvents.Changed, data);

      // Only emit the fully synchronized event the first time.
      if (!this.synchronized) {
        this.synchronized = true;
        process.nextTick(() => this.emit(UnleashEvents.Synchronized));
      }
    });

    this.metrics = new Metrics({
      disableMetrics,
      appName,
      instanceId: unleashInstanceId,
      strategies: supportedStrategies.map((strategy: Strategy) => strategy.name),
      metricsInterval,
      url: unleashUrl,
      headers: customHeaders,
      customHeadersFunction,
      timeout,
      httpOptions,
    });

    this.metrics.on(UnleashEvents.Error, (err) => {
      // eslint-disable-next-line no-param-reassign
      err.message = `Unleash Metrics error: ${err.message}`;
      this.emit(UnleashEvents.Error, err);
    });

    this.metrics.on(UnleashEvents.Warn, (msg) => {
      this.emit(UnleashEvents.Warn, msg);
    });

    this.metrics.on(UnleashEvents.Count, (name, enabled) => {
      this.emit(UnleashEvents.Count, name, enabled);
    });

    this.metrics.on(UnleashEvents.Sent, (payload) => {
      this.emit(UnleashEvents.Sent, payload);
    });

    this.metrics.on(UnleashEvents.Registered, (payload) => {
      this.emit(UnleashEvents.Registered, payload);
    });

    if(!disableAutoStart) {
      process.nextTick(async () => this.start());
    }
  }

  async start(): Promise<void> {
    await Promise.all([
      this.repository.start(),
      this.metrics.start()
    ]);
  }

  destroy() {
    this.repository.stop();
    this.metrics.stop();
    this.client = undefined;
  }

  isEnabled(name: string, context?: Context, fallbackFunction?: FallbackFunction): boolean;
  isEnabled(name: string, context?: Context, fallbackValue?: boolean): boolean;
  isEnabled(name: string, context: Context = {}, fallback?: FallbackFunction | boolean): boolean {
    const enhancedContext = { ...this.staticContext, ...context };
    const fallbackFunc = createFallbackFunction(name, enhancedContext, fallback);

    let result;
    if (this.client !== undefined) {
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

  getVariant(name: string, context: Context = {}, fallbackVariant?: Variant): Variant {
    const enhancedContext = { ...this.staticContext, ...context };
    let result;
    if (this.client !== undefined) {
      result = this.client.getVariant(name, enhancedContext, fallbackVariant);
    } else {
      result = typeof fallbackVariant !== 'undefined' ? fallbackVariant : getDefaultVariant();
      this.emit(
        UnleashEvents.Warn,
        `Unleash has not been initialized yet. isEnabled(${name}) defaulted to ${result}`,
      );
    }
    if (result.name) {
      this.countVariant(name, result.name);
    } else {
      this.count(name, result.enabled);
    }

    return result;
  }

  getFeatureToggleDefinition(toggleName: string): FeatureInterface {
    return this.repository.getToggle(toggleName);
  }

  getFeatureToggleDefinitions(): FeatureInterface[] {
    return this.repository.getToggles();
  }

  count(toggleName: string, enabled: boolean) {
    this.metrics.count(toggleName, enabled);
  }

  countVariant(toggleName: string, variantName: string) {
    this.metrics.countVariant(toggleName, variantName);
  }
}
