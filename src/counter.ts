import { EventEmitter } from 'events';
import { CustomHeaders, CustomHeadersFunction } from './headers';
import { HttpOptions } from './http-options';
import { getAppliedJitter } from './helpers';
import { resolveUrl, suffixSlash } from './url-utils';
import { post } from './request';
import { UnleashEvents } from './events';

type Counter = {
  name: string;
  labels: Record<string, string>;
  value: number;
};

interface CounterData {
  metrics: Counter[];
}

export interface CounterOptions {
  appName: string;
  environment: string;
  counterInterval: number;
  counterJitter: number;
  disableCounters: boolean;
  headers?: CustomHeaders;
  customHeadersFunction?: CustomHeadersFunction;
  timeout: number;
  httpOptions?: HttpOptions;
  url: string;
  instanceId?: string | undefined;
}

function sanitize(key: string): string {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+$/, '');
}

function counterKey(counter: Pick<Counter, 'name' | 'labels'>): string {
  return `${counter.name}:${Object.entries(counter.labels)
    .map(([k, v]) => `${k}=${v}`)
    .join(',')}`;
}

export class Counters extends EventEmitter {
  private counters: Map<string, Counter> = new Map();

  private readonly defaultLabels: Record<string, string>;

  private counterInterval: number;

  private counterJitter: number;

  private failures: number = 0;

  private timer: NodeJS.Timeout | undefined;

  private headers?: CustomHeaders;

  private customHeadersFunction?: CustomHeadersFunction;

  private timeout?: number;

  private httpOptions?: HttpOptions;

  private disabled: boolean;

  private url: string;

  constructor({
    appName,
    environment,
    counterInterval,
    counterJitter,
    disableCounters,
    headers,
    customHeadersFunction,
    timeout,
    httpOptions,
    url,
    instanceId,
  }: CounterOptions) {
    super();
    this.defaultLabels = {
      app_name: appName,
      environment,
    };
    if (instanceId) {
      this.defaultLabels.instance_id = instanceId;
    }
    this.counterInterval = counterInterval;
    this.counterJitter = counterJitter;
    this.disabled = disableCounters;
    this.headers = headers;
    this.customHeadersFunction = customHeadersFunction;
    this.timeout = timeout;
    this.httpOptions = httpOptions;
    this.url = url;
  }

  private getAppliedJitter(): number {
    return getAppliedJitter(this.counterJitter);
  }

  getFailures(): number {
    return this.failures;
  }

  getInterval(): number {
    if (this.counterInterval === 0) {
      return 0;
    } else {
      return this.counterInterval + this.failures * this.counterInterval + this.getAppliedJitter();
    }
  }

  private startTimer(): void {
    if (this.disabled || this.getInterval() === 0) {
      return;
    }
    this.timer = setTimeout(() => {
      this.sendCounters();
    }, this.getInterval());

    if (process.env.NODE_ENV !== 'test' && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  start(): void {
    if (this.counterInterval > 0) {
      this.startTimer();
    }
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      delete this.timer;
    }
    this.disabled = true;
  }

  configurationError(url: string, statusCode: number) {
    this.emit(UnleashEvents.Warn, `${url} returning ${statusCode}, stopping metrics`);
    this.counterInterval = 0;
    this.stop();
  }

  backoff(url: string, statusCode: number): void {
    this.failures = Math.min(10, this.failures + 1);
    // eslint-disable-next-line max-len
    this.emit(
      UnleashEvents.Warn,
      `${url} returning ${statusCode}. Backing off to ${this.failures} times normal interval`,
    );
    this.startTimer();
  }

  createCounterData(): CounterData {
    const metrics = [];
    for (const counterData of this.counters.values()) {
      metrics.push({
        name: counterData.name,
        labels: counterData.labels,
        value: counterData.value,
      });
    }
    return {
      metrics,
    };
  }

  async sendCounters(): Promise<void> {
    if (this.disabled) {
      return;
    }
    const url = resolveUrl(suffixSlash(this.url), './client/metrics/custom');
    const payload = this.createCounterData();

    const headers = this.customHeadersFunction ? await this.customHeadersFunction() : this.headers;
    try {
      const res = await post({
        url,
        json: payload,
        headers,
        timeout: this.timeout,
        httpOptions: this.httpOptions,
      });
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          this.configurationError(url, res.status);
        } else if (
          res.status === 404 ||
          res.status === 429 ||
          res.status === 500 ||
          res.status === 502 ||
          res.status === 503 ||
          res.status === 504
        ) {
          this.backoff(url, res.status);
        }
      } else {
        this.emit(UnleashEvents.Sent, payload);
        this.reduceBackoff();
      }
    } catch (err) {
      this.emit(UnleashEvents.Warn, err);
      this.startTimer();
    }
  }

  reduceBackoff(): void {
    this.failures = Math.max(0, this.failures - 1);
    this.startTimer();
  }

  count(name: string, labels: Record<string, string>, value: number = 1): void {
    const allLabels: Record<string, string> = {};
    for (const [localKey, mapVal] of Object.entries(this.defaultLabels)) {
      allLabels[sanitize(localKey)] = mapVal;
    }
    for (const [localKey, mapVal] of Object.entries(labels)) {
      allLabels[sanitize(localKey)] = mapVal;
    }
    const key = counterKey({ name, labels: allLabels });
    if (!this.counters.has(key)) {
      this.counters.set(key, { name, labels: allLabels, value });
    } else {
      this.counters.set(key, {
        ...this.counters.get(key)!,
        value: this.counters.get(key)!.value + value,
      });
    }
  }
}
