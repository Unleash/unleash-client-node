import { EventEmitter } from 'events';
import { ClientFeaturesResponse, FeatureInterface } from '../feature';
import { get } from '../request';
import { CustomHeaders, CustomHeadersFunction } from '../headers';
import getUrl from '../url-utils';
import { HttpOptions } from '../http-options';
import { TagFilter } from '../tags';
import { BootstrapProvider } from './bootstrap-provider';
import { StorageProvider } from './storage-provider';
import { UnleashEvents } from '../events';
import { Segment } from '../strategy/strategy';

const SUPPORTED_SPEC_VERSION = '4.3.0';

export interface RepositoryInterface extends EventEmitter {
  getToggle(name: string): FeatureInterface | undefined;
  getToggles(): FeatureInterface[];
  getSegment(id: number): Segment | undefined;
  stop(): void;
  start(): Promise<void>;
}
export interface RepositoryOptions {
  url: string;
  appName: string;
  instanceId: string;
  projectName?: string;
  refreshInterval: number;
  timeout?: number;
  headers?: CustomHeaders;
  customHeadersFunction?: CustomHeadersFunction;
  httpOptions?: HttpOptions;
  namePrefix?: string;
  tags?: Array<TagFilter>;
  bootstrapProvider: BootstrapProvider;
  bootstrapOverride?: boolean;
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

  private refreshInterval: number;

  private headers?: CustomHeaders;

  private failures: number = 0;

  private customHeadersFunction?: CustomHeadersFunction;

  private timeout?: number;

  private stopped = false;

  private projectName?: string;

  private httpOptions?: HttpOptions;

  private readonly namePrefix?: string;

  private readonly tags?: Array<TagFilter>;

  private bootstrapProvider: BootstrapProvider;

  private bootstrapOverride: boolean;

  private storageProvider: StorageProvider<ClientFeaturesResponse>;

  private ready: boolean = false;

  private connected: boolean = false;

  private data: FeatureToggleData = {};

  private segments: Map<number, Segment>;

  constructor({
    url,
    appName,
    instanceId,
    projectName,
    refreshInterval = 15_000,
    timeout,
    headers,
    customHeadersFunction,
    httpOptions,
    namePrefix,
    tags,
    bootstrapProvider,
    bootstrapOverride = true,
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
    this.bootstrapOverride = bootstrapOverride;
    this.storageProvider = storageProvider;
    this.segments = new Map();
  }

  timedFetch(interval: number) {
    if (interval > 0) {
      this.timer = setTimeout(() => this.fetch(), interval);
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
      this.emit(UnleashEvents.Error, err);
    }
  }

  async start(): Promise<void> {
    await Promise.all([this.fetch(), this.loadBackup(), this.loadBootstrap()]);
  }

  async loadBackup(): Promise<void> {
    try {
      const content = await this.storageProvider.get(this.appName);

      if (this.ready) {
        return;
      }

      if (content && this.notEmpty(content)) {
        this.data = this.convertToMap(content.features);
        this.segments = this.createSegmentLookup(content.segments);
        this.setReady();
      }
    } catch (err) {
      this.emit(UnleashEvents.Warn, err);
    }
  }

  setReady(): void {
    const doEmitReady = this.ready === false;
    this.ready = true;

    if (doEmitReady) {
      process.nextTick(() => {
        this.emit(UnleashEvents.Ready);
      });
    }
  }

  createSegmentLookup(segments: Segment[] | undefined): Map<number, Segment> {
    if (!segments) {
      return new Map();
    }
    return new Map(segments.map((segment) => [segment.id, segment]));
  }

  async save(response: ClientFeaturesResponse, fromApi: boolean): Promise<void> {
    if (fromApi) {
      this.connected = true;
      this.data = this.convertToMap(response.features);
      this.segments = this.createSegmentLookup(response.segments);
    } else if (!this.connected) {
      // Only allow bootstrap if not connected
      this.data = this.convertToMap(response.features);
      this.segments = this.createSegmentLookup(response.segments);
    }

    this.setReady();
    this.emit(UnleashEvents.Changed, [...response.features]);
    await this.storageProvider.set(this.appName, response);
  }

  notEmpty(content: ClientFeaturesResponse): boolean {
    return content.features.length > 0;
  }

  async loadBootstrap(): Promise<void> {
    try {
      const content = await this.bootstrapProvider.readBootstrap();

      if (!this.bootstrapOverride && this.ready) {
        // early exit if we already have backup data and should not override it.
        return;
      }

      if (content && this.notEmpty(content)) {
        await this.save(content, false);
      }
    } catch (err: any) {
      this.emit(
        UnleashEvents.Warn,
        `Unleash SDK was unable to load bootstrap.
Message: ${err.message}`,
      );
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

  getFailures(): number {
    return this.failures;
  }

  nextFetch(): number {
    return this.refreshInterval + this.failures * this.refreshInterval;
  }

  private backoff(): number {
    this.failures = Math.min(this.failures + 1, 10);
    return this.nextFetch();
  }

  private countSuccess(): number {
    this.failures = Math.max(this.failures - 1, 0);
    return this.nextFetch();
  }

  // Emits correct error message based on what failed,
  // and returns 0 as the next fetch interval (stop polling)
  private configurationError(url: string, statusCode: number): number {
    this.failures += 1;
    if (statusCode === 404) {
      this.emit(
        UnleashEvents.Error,
        new Error(
          // eslint-disable-next-line max-len
          `${url} responded NOT_FOUND (404) which means your API url most likely needs correction. Stopping refresh of toggles`,
        ),
      );
    } else if (statusCode === 401 || statusCode === 403) {
      this.emit(
        UnleashEvents.Error,
        new Error(
          // eslint-disable-next-line max-len
          `${url} responded ${statusCode} which means your API key is not allowed to connect. Stopping refresh of toggles`,
        ),
      );
    }
    return 0;
  }

  // We got a status code we know what to do with, so will log correct message
  // and return the new interval.
  private recoverableError(url: string, statusCode: number): number {
    let nextFetch = this.backoff();
    if (statusCode === 429) {
      this.emit(
        UnleashEvents.Warn,
        // eslint-disable-next-line max-len
        `${url} responded TOO_MANY_CONNECTIONS (429). Backing off`,
      );
    } else if (statusCode === 500 ||
               statusCode === 502 ||
               statusCode === 503 ||
               statusCode === 504) {
      this.emit(
        UnleashEvents.Warn,
        `${url} responded ${statusCode}. Backing off`,
      );
    }
    return nextFetch;
  }

  private handleErrorCases(url: string, statusCode: number): number {
    if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
      return this.configurationError(url, statusCode);
    } else if (
      statusCode === 429 ||
      statusCode === 500 ||
      statusCode === 502 ||
      statusCode === 503 ||
      statusCode === 504
    ) {
      return this.recoverableError(url, statusCode);
    } else {
      const error = new Error(`Response was not statusCode 2XX, but was ${statusCode}`);
      this.emit(UnleashEvents.Error, error);
      return this.refreshInterval;
    }
  }

  async fetch(): Promise<void> {
    if (this.stopped || !(this.refreshInterval > 0)) {
      return;
    }
    let nextFetch = this.refreshInterval;
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
        supportedSpecVersion: SUPPORTED_SPEC_VERSION,
      });
      if (res.status === 304) {
        // No new data
        this.emit(UnleashEvents.Unchanged);
      } else if (res.ok) {
        nextFetch = this.countSuccess();
        try {
          const data: ClientFeaturesResponse = await res.json();
          if (res.headers.get('etag') !== null) {
            this.etag = res.headers.get('etag') as string;
          } else {
            this.etag = undefined;
          }
          await this.save(data, true);
        } catch (err) {
          this.emit(UnleashEvents.Error, err);
        }
      } else {
        nextFetch = this.handleErrorCases(url, res.status);
      }
    } catch (err) {
      const e = err as { code: string };
      if (e.code === 'ECONNRESET') {
        nextFetch = Math.max(Math.floor(this.refreshInterval / 2), 1000);
        this.emit(UnleashEvents.Warn, `Socket keep alive error, retrying in ${nextFetch}ms`);
      } else {
        this.emit(UnleashEvents.Error, err);
      }
    } finally {
      this.timedFetch(nextFetch);
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

  getSegment(segmentId: number): Segment | undefined {
    return this.segments.get(segmentId);
  }

  getToggle(name: string): FeatureInterface | undefined {
    return this.data[name];
  }

  getToggles(): FeatureInterface[] {
    return Object.keys(this.data).map((key) => this.data[key]);
  }
}
