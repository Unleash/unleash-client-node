import { EventEmitter } from 'events';
import { resolve } from 'url';
import { post, Data } from './request';
import { CustomHeaders, CustomHeadersFunction } from './unleash';
import { sdkVersion } from './details.json';

export interface MetricsOptions {
    appName: string;
    instanceId: string;
    strategies: string[];
    disableMetrics?: boolean;
    bucketInterval?: number;
    url: string;
    headers?: CustomHeaders;
    customHeadersFunction?: CustomHeadersFunction;
    timeout?: number;
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
    private disabled: boolean;
    private url: string;
    private started: Date;
    private headers?: CustomHeaders;
    private customHeadersFunction?: CustomHeadersFunction;
    private timeout?: number;

    constructor({
        appName,
        instanceId,
        strategies,
        disableMetrics = false,
        url,
        headers,
        customHeadersFunction,
        timeout,
    }: MetricsOptions) {
        super();
        this.disabled = disableMetrics;
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

        this.registerInstance().catch(err => {
            this.emit('error', err);
        });
    }

    async registerInstance(): Promise<boolean> {
        if (this.disabled) {
            return false;
        }
        const url = resolve(this.url, './client/register');
        const payload = this.getClientData();

        const headers = this.customHeadersFunction
            ? await this.customHeadersFunction()
            : this.headers;

        try {
            const fetchResult = await post({
                url,
                json: payload,
                appName: this.appName,
                instanceId: this.instanceId,
                headers,
                timeout: this.timeout,
            });

            /* istanbul ignore next if */
            if (!(fetchResult.status && fetchResult.status >= 200 && fetchResult.status < 300)) {
                this.emit(
                    'warn',
                    `${url} returning ${fetchResult.status}`,
                    await fetchResult.text(),
                );
                return false;
            }
            /* istanbul ignore next line */
            this.emit('registered', payload);
        } catch (err) {
            this.emit('error', err);
        }

        return true;
    }

    async sendMetrics(): Promise<boolean> {
        /* istanbul ignore next if */
        if (this.disabled) {
            return false;
        }
        if (this.bucketIsEmpty()) {
            this.resetBucket();
            return true;
        }
        const url = resolve(this.url, './client/metrics');
        const payload = this.getPayload();

        const headers = this.customHeadersFunction
            ? await this.customHeadersFunction()
            : this.headers;
        try {
            const fetchResult = await post({
                url,
                json: payload,
                appName: this.appName,
                instanceId: this.instanceId,
                headers,
                timeout: this.timeout,
            });

            /* istanbul ignore next if */
            if (fetchResult.status === 404) {
                this.emit('warn', `${url} returning 404, stopping metrics`);
                return false;
            }

            /* istanbul ignore next if */
            if (!(fetchResult.status && fetchResult.status >= 200 && fetchResult.status < 300)) {
                this.emit(
                    'warn',
                    `${url} returning ${fetchResult.status}`,
                    await fetchResult.text(),
                );
                return false;
            }
            this.emit('sent', payload);
        } catch (err) {
            this.emit('error', err);
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
