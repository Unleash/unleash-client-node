import { EventEmitter } from 'events';
import { Response } from 'request';
import { resolve } from 'url';
import { post, Data } from './request';
import { CustomHeaders } from './unleash';
import { sdkVersion } from './details.json';

export interface MetricsOptions {
    appName: string;
    instanceId: string;
    strategies: string[];
    metricsInterval: number;
    disableMetrics?: boolean;
    bucketInterval?: number;
    url: string;
    headers?: CustomHeaders;
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

    constructor({
        appName,
        instanceId,
        strategies,
        metricsInterval = 0,
        disableMetrics = false,
        url,
        headers,
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
        this.started = new Date();
        this.resetBucket();

        if (typeof this.metricsInterval === 'number' && this.metricsInterval > 0) {
            this.startTimer();
            this.registerInstance();
        }
    }

    private startTimer() {
        if (this.disabled) {
            return false;
        }
        this.timer = setTimeout(() => {
            this.sendMetrics();
        }, this.metricsInterval);

        if (process.env.NODE_ENV !== 'test') {
            this.timer.unref();
        }
        return true;
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            delete this.timer;
        }
        this.disabled = true;
    }

    registerInstance(): boolean {
        if (this.disabled) {
            return false;
        }
        const url = resolve(this.url, './client/register');
        const payload = this.getClientData();
        post(
            {
                url,
                json: payload,
                appName: this.appName,
                instanceId: this.instanceId,
                headers: this.headers,
            },
            (err: Error | null, res: Response, body: any) => {
                if (err) {
                    this.emit('error', err);
                    return;
                }

                if (!(res.statusCode && res.statusCode >= 200 && res.statusCode < 300)) {
                    this.emit('warn', `${url} returning ${res.statusCode}`, body);
                    return;
                }
                this.emit('registered', payload);
            },
        );
        return true;
    }

    sendMetrics(): boolean {
        if (this.disabled) {
            return false;
        }
        if (this.bucketIsEmpty()) {
            this.resetBucket();
            this.startTimer();
            return true;
        }
        const url = resolve(this.url, './client/metrics');
        const payload = this.getPayload();
        post(
            {
                url,
                json: payload,
                appName: this.appName,
                instanceId: this.instanceId,
                headers: this.headers,
            },
            (err: Error | null, res: Response, body: any) => {
                this.startTimer();
                if (err) {
                    this.emit('error', err);
                    return;
                }

                if (res.statusCode === 404) {
                    this.emit('warn', `${url} returning 404, stopping metrics`);
                    this.stop();
                    return;
                }

                if (!(res.statusCode && res.statusCode >= 200 && res.statusCode < 300)) {
                    this.emit('warn', `${url} returning ${res.statusCode}`, body);
                    return;
                }
                this.emit('sent', payload);
            },
        );
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
    }

    count(name: string, enabled: boolean): boolean {
        if (this.disabled || !this.bucket) {
            return false;
        }
        this.assertBucket(name);
        this.bucket.toggles[name][enabled ? 'yes' : 'no']++;
        this.emit('count', name, enabled);
        return true;
    }

    countVariant(name: string, variantName: string) {
        if (this.disabled || !this.bucket) {
            return false;
        }
        this.assertBucket(name);
        const variants = this.bucket.toggles[name].variants;
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

        this.emit('countVariant', name, variantName);
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
