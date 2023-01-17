import { EventEmitter } from 'events';
import { post } from './request';
import { CustomHeaders, CustomHeadersFunction } from './headers';
import { sdkVersion } from './details.json';
import { HttpOptions } from './http-options';
import { suffixSlash, resolveUrl } from './url-utils';
import { UnleashEvents } from './events';
import { getAppliedJitter } from './helpers';

export interface MetricsOptions {
  appName: string;
  instanceId: string;
  strategies: string[];
  metricsInterval: number;
  metricsJitter?: number;
  disableMetrics?: boolean;
  url: string;
  headers?: CustomHeaders;
  customHeadersFunction?: CustomHeadersFunction;
  timeout?: number;
  httpOptions?: HttpOptions;
}

interface VariantBucket {
  [s: string]: number;
}

interface Bucket {
  start: Date;
  stop?: Date;
  toggles: { [s: string]: { yes: number; no: number; variants: VariantBucket } };
}

interface MetricsData {
  appName: string;
  instanceId: string;
  bucket: Bucket;
}

interface RegistrationData {
  appName:    string;
  instanceId: string;
  sdkVersion: string;
  strategies: string[];
  started:    Date;
  interval:   number
}

export default class Metrics extends EventEmitter {
  private bucket: Bucket;

  private appName: string;

  private instanceId: string;

  private sdkVersion: string;

  private strategies: string[];

  private metricsInterval: number;

  private metricsJitter: number;

  private disabled: boolean;

  private url: string;

  private timer: NodeJS.Timer | undefined;

  private started: Date;

  private headers?: CustomHeaders;

  private customHeadersFunction?: CustomHeadersFunction;

  private timeout?: number;

  private httpOptions?: HttpOptions;

  constructor({
    appName,
    instanceId,
    strategies,
    metricsInterval = 0,
    metricsJitter = 0,
    disableMetrics = false,
    url,
    headers,
    customHeadersFunction,
    timeout,
    httpOptions,
  }: MetricsOptions) {
    super();
    this.disabled = disableMetrics;
    this.metricsInterval = metricsInterval;
    this.metricsJitter = metricsJitter;
    this.appName = appName;
    this.instanceId = instanceId;
    this.sdkVersion = sdkVersion;
    this.strategies = strategies;
    this.url = url;
    this.headers = headers;
    this.customHeadersFunction = customHeadersFunction;
    this.started = new Date();
    this.timeout = timeout;
    this.bucket = this.createBucket();
    this.httpOptions = httpOptions;
  }

  private getAppliedJitter(): number {
    return getAppliedJitter(this.metricsJitter);
  }

  private startTimer(): void {
    if (this.disabled) {
      return;
    }
    this.timer = setTimeout(() => {
      this.sendMetrics();
    }, this.metricsInterval + this.getAppliedJitter());

    if (process.env.NODE_ENV !== 'test' && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  start(): void {
    if (typeof this.metricsInterval === 'number' && this.metricsInterval > 0) {
      this.startTimer();
      this.registerInstance();
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      delete this.timer;
    }
    this.disabled = true;
  }

  async registerInstance(): Promise<boolean> {
    if (this.disabled) {
      return false;
    }
    const url = resolveUrl(suffixSlash(this.url), './client/register');
    const payload = this.getClientData();

    const headers = this.customHeadersFunction ? await this.customHeadersFunction() : this.headers;

    try {
      const res = await post({
        url,
        json: payload,
        appName: this.appName,
        instanceId: this.instanceId,
        headers,
        timeout: this.timeout,
        httpOptions: this.httpOptions,
      });
      if (!res.ok) {
        // status code outside 200 range
        this.emit(UnleashEvents.Warn, `${url} returning ${res.status}`, await res.text());
      } else {
        this.emit(UnleashEvents.Registered, payload);
      }
    } catch (err) {
      this.emit(UnleashEvents.Warn, err);
    }
    return true;
  }

  async sendMetrics(): Promise<void> {
    if (this.disabled) {
      return;
    }
    if (this.bucketIsEmpty()) {
      this.resetBucket();
      this.startTimer();
      return;
    }
    const url = resolveUrl(suffixSlash(this.url), './client/metrics');
    const payload = this.createMetricsData();

    const headers = this.customHeadersFunction ? await this.customHeadersFunction() : this.headers;

    try {
      const res = await post({
        url,
        json: payload,
        appName: this.appName,
        instanceId: this.instanceId,
        headers,
        timeout: this.timeout,
        httpOptions: this.httpOptions,
      });
      this.startTimer();
      if (res.status === 404) {
        this.emit(UnleashEvents.Warn, `${url} returning 404, stopping metrics`);
        this.stop();
      }
      if (!res.ok) {
        this.restoreBucket(payload.bucket);
        this.emit(UnleashEvents.Warn, `${url} returning ${res.status}`, await res.text());
      } else {
        this.emit(UnleashEvents.Sent, payload);
      }
    } catch (err) {
      this.restoreBucket(payload.bucket);
      this.emit(UnleashEvents.Warn, err);
      this.startTimer();
    }
  }

  assertBucket(name: string): void {
    if (this.disabled) {
      return;
    }
    if (!this.bucket.toggles[name]) {
      this.bucket.toggles[name] = {
        yes: 0,
        no: 0,
        variants: {},
      };
    }
  }

  count(name: string, enabled: boolean): void {
    if (this.disabled) {
      return;
    }
    this.increaseCounter(name, enabled, 1);
    this.emit(UnleashEvents.Count, name, enabled);
  }

  countVariant(name: string, variantName: string): void {
    if (this.disabled) {
      return;
    }
    this.increaseVariantCounter(name, variantName, 1);

    this.emit(UnleashEvents.CountVariant, name, variantName);
  }

  private increaseCounter(name: string, enabled: boolean, inc = 1): void {
    if(inc === 0) {
      return;
    }
    this.assertBucket(name);
    this.bucket.toggles[name][enabled ? 'yes' : 'no'] += inc;
  }

  private increaseVariantCounter(name: string, variantName: string, inc = 1): void {
    this.assertBucket(name);
    if(this.bucket.toggles[name].variants[variantName]) {
      this.bucket.toggles[name].variants[variantName]+=inc 
    } else {
      this.bucket.toggles[name].variants[variantName] = inc;
    }
  }

  private bucketIsEmpty(): boolean {
    return Object.keys(this.bucket.toggles).length === 0;
  }

  private createBucket(): Bucket {
    return {
      start: new Date(),
      stop: undefined,
      toggles: {},
    };
  }

  private resetBucket(): void {
    this.bucket = this.createBucket();
  }

  createMetricsData(): MetricsData {
    const bucket = {...this.bucket, stop: new Date()};
    this.resetBucket();
    return {
      appName: this.appName,
      instanceId: this.instanceId,
      bucket,
    };
  }

  private restoreBucket(bucket: Bucket): void {
    if(this.disabled) {
      return;
    }
    this.bucket.start = bucket.start;

    const { toggles } = bucket;
    Object.keys(toggles).forEach(toggleName => {
      const toggle = toggles[toggleName];      
      this.increaseCounter(toggleName, true, toggle.yes);
      this.increaseCounter(toggleName, false, toggle.no);

      Object.keys(toggle.variants).forEach(variant => {
        this.increaseVariantCounter(toggleName, variant, toggle.variants[variant]);
      })
    });
  }

  getClientData(): RegistrationData {
    return {
      appName: this.appName,
      instanceId: this.instanceId,
      sdkVersion: this.sdkVersion,
      strategies: this.strategies,
      started: this.started,
      interval: this.metricsInterval,
    };
  }
}
