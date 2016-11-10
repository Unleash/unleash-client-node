import { EventEmitter } from 'events';
import { ClientResponse } from 'http';
import { resolve } from 'url';
import { post, Data } from './request';

export interface MetricsOptions {
    appName : string,
    instanceId : string,
    strategies : string [],
    metricsInterval : number,
    disableMetrics?: boolean,
    bucketInterval?: number
    url : string,
}

interface Bucket {
    start: Date,
    stop: Date | null,
    toggles: Object
}

export default class Metrics extends EventEmitter {
    private bucket: Bucket;
    private appName : string;
    private instanceId : string;
    private strategies : string [];
    private metricsInterval: number;
    private disabled: boolean;
    private bucketInterval: number;
    private url : string;
    private timer : NodeJS.Timer;
    private started : Date;

    constructor ({
        appName,
        instanceId,
        strategies,
        metricsInterval = 0,
        disableMetrics = false,
        url,
        } : MetricsOptions
    ) {
        super();
        this.disabled = disableMetrics;
        this.metricsInterval = metricsInterval;
        this.appName = appName;
        this.instanceId = instanceId;
        this.strategies = strategies;
        this.url = url;
        this.started = new Date();
        this.resetBucket();

        if (typeof this.metricsInterval === 'number' && this.metricsInterval > 0) {
            this.startTimer();
            this.registerInstance();
        }
    }

    private startTimer () {
        if (this.disabled) {
            return false;
        }
        this.timer = setTimeout(() => {
            this.sendMetrics();
        }, this.metricsInterval);
        this.timer.unref();
        return true;
    }

    stop () {
        clearInterval(this.timer);
        delete this.timer;
        this.disabled = true;
    }

    registerInstance () : boolean {
        if (this.disabled) {
            return false;
        }
        const url = resolve(this.url, './client/register');
        const payload = this.getClientData();
        post({
            url,
            json: payload,
        }, (err, res: ClientResponse, body) => {
            if (err) {
                this.emit('error', err);
                return;
            }

            if (res.statusCode !== 200) {
                this.emit('warn', `${url} returning ${res.statusCode}`);
                return;
            }
            this.emit('registered', payload);
        });
        return true;
    }

    sendMetrics () : boolean {
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
        post({
             url,
             json: payload,
        }, (err, res: ClientResponse, body) => {
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

            if (res.statusCode !== 200) {
                this.emit('warn', `${url} returning ${res.statusCode}`);
                return;
            }
            this.emit('sent', payload);
        });
        return true;
    }


    count (name: string, enabled: boolean) : boolean {
        if (this.disabled) {
            return false;
        }
        if (!this.bucket.toggles[name]) {
            this.bucket.toggles[name] = {
                yes: 0,
                no: 0,
            };
        }
        this.bucket.toggles[name][enabled ? 'yes' : 'no']++;
        this.emit('count', name, enabled);
        return true;
    }

    private bucketIsEmpty () {
        return Object.keys(this.bucket.toggles).length === 0;
    }

    private resetBucket () {
        const bucket : Bucket = {
            start: new Date(),
            stop: null,
            toggles: {}
        };
        this.bucket = bucket;
    }

    private closeBucket () {
        this.bucket.stop = new Date();
    }

    private getPayload () : Data {
        this.closeBucket();
        const payload = this.getMetricsData();
        this.resetBucket();
        return payload;
    }

    getClientData() : Data {
        return {
            appName: this.appName,
            instanceId: this.instanceId,
            strategies: this.strategies,
            started: this.started,
            interval: this.metricsInterval,
        };
    }


    getMetricsData () : Data {
        return {
            appName: this.appName,
            instanceId: this.instanceId,
            bucket: this.bucket,
        };
    }
}
