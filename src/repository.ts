import { EventEmitter } from 'events';
import { ClientFeaturesResponse, FeatureInterface } from './feature';
import { get } from './request';
import { CustomHeaders, CustomHeadersFunction } from './headers';
import getUrl from './url-utils';
import { HttpOptions } from './http-options';
import { TagFilter } from './tags';
import { BootstrapProvider } from './repository/bootstrap-provider';
import { StorageProvider } from './repository/storage-provider';
import { UnleashEvents } from './events';

export interface RepositoryInterface extends EventEmitter {
  getToggle(name: string): FeatureInterface;
  getToggles(): FeatureInterface[];
  stop(): void;
  start(): Promise<void>;
}
export interface RepositoryOptions {
  url: string;
  appName: string;
  instanceId: string;
  projectName?: string;
  refreshInterval?: number;
  timeout?: number;
  headers?: CustomHeaders;
  customHeadersFunction?: CustomHeadersFunction;
  httpOptions?: HttpOptions;
  namePrefix?: string;
  tags?: Array<TagFilter>;
  bootstrapProvider: BootstrapProvider;
  storageProvider: StorageProvider<ClientFeaturesResponse>;
}

interface FeatureToggleData {
  [key: string]: FeatureInterface;
}

export default class Repository extends EventEmitter implements EventEmitter {
  private timer: NodeJS.Timer | undefined;

  private url: string;

  private etag: string | undefined;

  private appName: string;

  private instanceId: string;

  private refreshInterval?: number;

  private headers?: CustomHeaders;

  private customHeadersFunction?: CustomHeadersFunction;

  private timeout?: number;

  private stopped = false;

  private projectName?: string;

  private httpOptions?: HttpOptions;

  private readonly namePrefix?: string;

  private readonly tags?: Array<TagFilter>;

  private bootstrapProvider: BootstrapProvider;

  private storageProvider: StorageProvider<ClientFeaturesResponse>;

  private isReady: boolean = false;

  private data: FeatureToggleData = {};

  constructor({
    url,
    appName,
    instanceId,
    projectName,
    refreshInterval,
    timeout,
    headers,
    customHeadersFunction,
    httpOptions,
    namePrefix,
    tags,
    bootstrapProvider,
    storageProvider,
  }: RepositoryOptions) {
    super();
    this.url = url;
    this.refreshInterval = refreshInterval;
    this.instanceId = instanceId;
    this.appName = appName;
    this.projectName = projectName;
    this.headers = headers;
    this.timeout = timeout;
    this.customHeadersFunction = customHeadersFunction;
    this.httpOptions = httpOptions;
    this.namePrefix = namePrefix;
    this.tags = tags;
    this.bootstrapProvider = bootstrapProvider;
    this.storageProvider = storageProvider;
    process.nextTick(async () => this.start())
  }

  timedFetch() {
    if (this.refreshInterval != null && this.refreshInterval > 0) {
      this.timer = setTimeout(() => this.fetch(), this.refreshInterval);
      if (process.env.NODE_ENV !== 'test' && typeof this.timer.unref === 'function') {
        this.timer.unref();
      }
    }
  }

  validateFeature(feature: FeatureInterface) {
    const errors: string[] = [];
    if (!Array.isArray(feature.strategies)) {
      errors.push(`feature.strategies should be an array, but was ${typeof feature.strategies}`);
    }

    if (feature.variants && !Array.isArray(feature.variants)) {
      errors.push(`feature.variants should be an array, but was ${typeof feature.variants}`);
    }

    if (typeof feature.enabled !== 'boolean') {
      errors.push(`feature.enabled should be an boolean, but was ${typeof feature.enabled}`);
    }

    if (errors.length > 0) {
      const err = new Error(errors.join(', '));
      this.emit(UnleashEvents.error, err);
    }
  }

  async start(): Promise<void> {
    await Promise.all([
      this.fetch(),
      this.loadBackup(),
      this.loadBootstrap(),
    ])
  }

  async loadBackup(): Promise<void> {
    try {
      const content = await this.storageProvider.load();
      if(this.isReady) {
        return
      }

      if(content && this.notEmpty(content)) {
        this.data = this.convertToMap(content.features);
      }
      this.setReady();
      
    } catch (err){
      this.emit(UnleashEvents.error, err);
    }
  }

  setReady(): void {
    const doEmitReady = this.isReady === false;
    this.isReady = true;

    if(doEmitReady) {
      process.nextTick(() => {
        this.emit(UnleashEvents.ready);
      });
    }
  }

  async save(response: ClientFeaturesResponse): Promise<void> {
    this.data = this.convertToMap(response.features);
    this.setReady();
    this.emit(UnleashEvents.changed, [...response.features]);
    this.storageProvider.save(response);
  }

  notEmpty(content: ClientFeaturesResponse): boolean {
    return content.features.length > 0;
  }

  async loadBootstrap(): Promise<void> {
    const content = await this.bootstrapProvider.readBootstrap();

    if(content && this.notEmpty(content)) {
      await this.save(content);
    }
  }

  private convertToMap(features: FeatureInterface[]): FeatureToggleData {
    const obj = features.reduce(
      (o: { [s: string]: FeatureInterface }, feature: FeatureInterface) => {
        const a = { ...o };
        this.validateFeature(feature);
        a[feature.name] = feature;
        return a;
      },
      {} as { [s: string]: FeatureInterface },
    );

    return obj;
  }

  async fetch(): Promise<void> {
    if (this.stopped) {
      return;
    }

    try {
      let mergedTags;
      if (this.tags) {
        mergedTags = this.mergeTagsToStringArray(this.tags);
      }
      const url = getUrl(this.url, this.projectName, this.namePrefix, mergedTags);

      const headers = this.customHeadersFunction
        ? await this.customHeadersFunction()
        : this.headers;

      const res = await get({
        url,
        etag: this.etag,
        appName: this.appName,
        timeout: this.timeout,
        instanceId: this.instanceId,
        headers,
        httpOptions: this.httpOptions,
      });

      if (res.status === 304) {
        // No new data
        this.emit(UnleashEvents.unchanged);
      } else if (!res.ok) {
        const error = new Error(`Response was not statusCode 2XX, but was ${res.status}`);
        this.emit(UnleashEvents.error, error);
      } else {
        try {
          const data: ClientFeaturesResponse = await res.json();
          if (res.headers.get('etag') !== null) {
            this.etag = res.headers.get('etag') as string;
          } else {
            this.etag = undefined;
          }
          await this.save(data);
        } catch (err) {
          this.emit(UnleashEvents.error, err);
        }
      }
    } catch (err) {
      this.emit(UnleashEvents.error, err);
    } finally {
      this.timedFetch();
    }
  }

  mergeTagsToStringArray(tags: Array<TagFilter>): Array<string> {
    return tags.map((tag) => `${tag.name}:${tag.value}`);
  }

  stop() {
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.removeAllListeners();
  }

  getToggle(name: string): FeatureInterface {
    return this.data[name];
  }

  getToggles(): FeatureInterface[] {
    return Object.keys(this.data).map((key) => this.data[key]);
  }
}
