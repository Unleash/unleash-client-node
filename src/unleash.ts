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

export { Strategy };

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
  }: UnleashConfig) {
    super();

    if (!url) {
      throw new Error('Unleash server URL missing');
    }
    let unleashUrl = url;
    if (unleashUrl.endsWith('/features')) {
      const oldUrl = unleashUrl;
      process.nextTick(() =>
        this.emit(
          'warn',
          `Unleash server URL "${oldUrl}" should no longer link directly to /features`,
        ),
      );
      unleashUrl = unleashUrl.replace(/\/features$/, '');
    }

    if (!unleashUrl.endsWith('/')) {
      unleashUrl += '/';
    }

    if (!appName) {
      throw new Error('Unleash client appName missing');
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

    this.repository.on('ready', () => {
      this.client = new Client(this.repository, supportedStrategies);
      this.client.on('error', (err) => this.emit('error', err));
      this.client.on('warn', (msg) => this.emit('warn', msg));
      process.nextTick(() => {
        this.emit('ready');
      });
    });

    this.repository.on('error', (err) => {
      // eslint-disable-next-line no-param-reassign
      err.message = `Unleash Repository error: ${err.message}`;
      this.emit('error', err);
    });

    this.repository.on('warn', (msg) => {
      this.emit('warn', msg);
    });

    this.repository.on('unchanged', () => {
      this.emit('unchanged');
    });

    this.repository.on('changed', (data) => {
      this.emit('changed', data);

      // Only emit the fully synchronized event the first time.
      if (!this.synchronized) {
        this.synchronized = true;
        process.nextTick(() => this.emit('synchronized'));
      }
    });

    // process.nextTick(async () => this.repository.start());

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

    this.metrics.on('error', (err) => {
      // eslint-disable-next-line no-param-reassign
      err.message = `Unleash Metrics error: ${err.message}`;
      this.emit('error', err);
    });

    this.metrics.on('warn', (msg) => {
      this.emit('warn', msg);
    });

    this.metrics.on('count', (name, enabled) => {
      this.emit('count', name, enabled);
    });

    this.metrics.on('sent', (payload) => {
      this.emit('sent', payload);
    });

    this.metrics.on('registered', (payload) => {
      this.emit('registered', payload);
    });
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
        'warn',
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
        'warn',
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
