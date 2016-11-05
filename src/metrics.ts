import { EventEmitter } from 'events';
import { ClientResponse } from 'http';
import { resolve } from 'url';
import { post, Data } from './request';

interface MetricsOptions {
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
    stop: Date,
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

        if (this.metricsInterval > 0) {
            this.startTimer();
            this.registerInstance();
        }
    }

    private startTimer () {
        this.timer = setTimeout(() => {
            this.sendMetrics();
        }, this.metricsInterval);
        this.timer.unref();

    }

    registerInstance () {
        if (this.disabled) {
            return;
        }
        const url = resolve(this.url, '/client/register');
        post({
            url,
            json: this.getClientData(),
        }, (err, res: ClientResponse, body) => {
            if (err) {
                this.emit('error', err);
                return;
            }

            if (res.statusCode !== 200) {
                this.emit('warn', `${url} returning ${res.statusCode}`);
                return;
            }
        });
    }

    sendMetrics () {
        if (this.disabled) {
            return;
        }
        if (this.bucketIsEmpty()) {
            this.resetBucket();
            return this.startTimer();
        }
        const url = resolve(this.url, '/client/metrics');
        post({
             url,
             json: this.getPayload(),
        }, (err, res: ClientResponse, body) => {
            this.startTimer();
            if (err) {
                this.emit('error', err);
                return;
            }

            if (res.statusCode === 404) {
                this.emit('warn', `${url} returning 404, stopping metrics`);
                clearTimeout(this.timer);
                return;
            }

            if (res.statusCode !== 200) {
                this.emit('warn', `${url} returning ${res.statusCode}`);
                return;
            }
        });
    }


    count (name: string, enabled: boolean) : void {
        if (this.disabled) {
            return;
        }
        if (!this.bucket.toggles[name]) {
            this.bucket.toggles[name] = {
                yes: 0,
                no: 0,
            };
        }
        this.bucket.toggles[name][enabled ? 'yes' : 'no'] += 1;
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
