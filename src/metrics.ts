import { EventEmitter } from 'events';
import { resolve } from 'url';
import { post, Data } from './request';
import { CustomHeaders, CustomHeadersFunction } from './headers';
import { sdkVersion } from './details.json';
import { HttpOptions } from './http-options';
import { suffixSlash } from './url-utils';
import { UnleashEvents } from './events';

export interface MetricsOptions {
  appName: string;
  instanceId: string;
  strategies: string[];
  metricsInterval: number;
  disableMetrics?: boolean;
  bucketInterval?: number;
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
  stop: Date | null;
  toggles: { [s: string]: { yes: number; no: number; variants?: VariantBucket } };
}

export default class Metrics extends EventEmitter {
  private bucket: Bucket | undefined;

  private appName: string;

  private instanceId: string;

  private sdkVersion: string;

  private strategies: string[];

  private metricsInterval: number;

  private disabled: boolean;

  private bucketInterval: number | undefined;

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
    this.appName = appName;
    this.instanceId = instanceId;
    this.sdkVersion = sdkVersion;
    this.strategies = strategies;
    this.url = url;
    this.headers = headers;
    this.customHeadersFunction = customHeadersFunction;
    this.started = new Date();
    this.timeout = timeout;
    this.resetBucket();
    this.httpOptions = httpOptions;
  }

  private startTimer() {
    if (this.disabled) {
      return false;
    }
    this.timer = setTimeout(() => {
      this.sendMetrics();
    }, this.metricsInterval);

    if (process.env.NODE_ENV !== 'test' && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
    return true;
  }

  start() {
    if (typeof this.metricsInterval === 'number' && this.metricsInterval > 0) {
      this.startTimer();
      this.registerInstance();
    }
  }

  stop() {
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
    const url = resolve(suffixSlash(this.url), './client/register');
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
      this.emit(UnleashEvents.Error, err);
    }
    return true;
  }

  async sendMetrics(): Promise<boolean> {
    if (this.disabled) {
      return false;
    }
    if (this.bucketIsEmpty()) {
      this.resetBucket();
      this.startTimer();
      return true;
    }
    const url = resolve(suffixSlash(this.url), './client/metrics');
    const payload = this.getPayload();

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
        this.emit(UnleashEvents.Warn, `${url} returning ${res.status}`, await res.text());
      } else {
        this.emit(UnleashEvents.Sent, payload);
      }
    } catch (err) {
      this.emit(UnleashEvents.Error, err);
      this.startTimer();
    }
    return true;
  }

  assertBucket(name: string) {
    if (this.disabled || !this.bucket) {
      return false;
    }
    if (!this.bucket.toggles[name]) {
      this.bucket.toggles[name] = {
        yes: 0,
        no: 0,
      };
    }
    return true;
  }

  count(name: string, enabled: boolean): boolean {
    if (this.disabled || !this.bucket) {
      return false;
    }
    this.assertBucket(name);
    this.bucket.toggles[name][enabled ? 'yes' : 'no']++;
    this.emit(UnleashEvents.Count, name, enabled);
    return true;
  }

  countVariant(name: string, variantName: string) {
    if (this.disabled || !this.bucket) {
      return false;
    }
    this.assertBucket(name);
    const { variants } = this.bucket.toggles[name];
    if (typeof variants !== 'undefined') {
      if (!variants[variantName]) {
        variants[variantName] = 1;
      } else {
        variants[variantName]++;
      }
    } else {
      this.bucket.toggles[name].variants = {
        [variantName]: 1,
      };
    }

    this.emit(UnleashEvents.CountVariant, name, variantName);
    return true;
  }

  private bucketIsEmpty() {
    if (!this.bucket) {
      return false;
    }
    return Object.keys(this.bucket.toggles).length === 0;
  }

  private resetBucket() {
    const bucket: Bucket = {
      start: new Date(),
      stop: null,
      toggles: {},
    };
    this.bucket = bucket;
  }

  private closeBucket() {
    if (this.bucket) {
      this.bucket.stop = new Date();
    }
  }

  private getPayload(): Data {
    this.closeBucket();
    const payload = this.getMetricsData();
    this.resetBucket();
    return payload;
  }

  getClientData(): Data {
    return {
      appName: this.appName,
      instanceId: this.instanceId,
      sdkVersion: this.sdkVersion,
      strategies: this.strategies,
      started: this.started,
      interval: this.metricsInterval,
    };
  }

  getMetricsData(): Data {
    return {
      appName: this.appName,
      instanceId: this.instanceId,
      bucket: this.bucket,
    };
  }
}
