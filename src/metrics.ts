import { EventEmitter } from 'events';
import * as request from 'request';
import { ClientResponse } from 'http';
import { resolve } from 'url';

interface MetricsOptions {
    appName : string,
    instanceId : string,
    strategies : string [],
    metricsInterval : number,
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
    private bucketInterval: number;
    private url : string;
    private timer : NodeJS.Timer;
    private started : Date;

    constructor ({
        appName,
        instanceId,
        strategies,
        metricsInterval,
        url,
        } : MetricsOptions
    ) {
        super();
        this.metricsInterval = metricsInterval;
        this.appName = appName;
        this.instanceId = instanceId;
        this.strategies = strategies;
        this.url = url;
        this.started = new Date();
        this.resetBucket();
        this.startTimer();
        this.registerInstance();
    }

    private startTimer () {
        if (this.metricsInterval) {
            this.timer = setTimeout(() => {
                this.sendMetrics();
            }, this.metricsInterval);
            this.timer.unref();
        }
    }

    registerInstance () {
        const url = resolve(this.url, '/client/register');
        request.post({
            url,
            headers: {
                'content-type': 'application/json',
            },
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
        const url = resolve(this.url, '/client/metrics');
        request.post({
             url,
             headers: {
                'content-type': 'application/json',
            },
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
        if (!this.bucket.toggles[name]) {
            this.bucket.toggles[name] = {
                yes: 0,
                no: 0,
            };
        }
        this.bucket.toggles[name][enabled ? 'yes' : 'no'] += 1;
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

    private getPayload () {
        this.closeBucket();
        const payload = this.getMetricsData();
        this.resetBucket();
        return payload;
    }

    getClientData() {
        return JSON.stringify({
            appName: this.appName,
            instanceId: this.instanceId,
            strategies: this.strategies,
            started: this.started,
            interval: this.metricsInterval,
        });
    }


    getMetricsData () : string {
        return JSON.stringify({
            appName: this.appName,
            instanceId: this.instanceId,
            bucket: this.bucket,
        });
    }
}
