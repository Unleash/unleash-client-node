'use strict';
import * as request from 'request';
import { EventEmitter } from 'events';
import { toNewFormat, pickData } from './data-formatter';
import { Storage } from './storage';
import { FeatureInterface } from './feature';

export default class Repository extends EventEmitter implements EventEmitter {
    private timer;
    private url: string;
    private storage: Storage;
    private etag: string;
    
    constructor (backupPath: string, url: string, refreshIntervall?: number, StorageImpl = Storage) {
        super();
        if (!url.startsWith('http')) {
            throw new Error(`Wrong url: ${url}`);
        }
        this.url = url;

        this.storage = new StorageImpl(backupPath);
        this.storage.on('error', (err) => this.emit('error', err));
        this.storage.on('ready', () => this.emit('ready'));
        
        this.fetch();

        if (refreshIntervall) {
            this.timer = setInterval(() => this.fetch(), refreshIntervall);
            this.timer.unref();
        }
    }

    validateFeature (feature: FeatureInterface) {
        const errors = [];
        if (!Array.isArray(feature.strategies)) {
            errors.push(`feature.strategies should be an array, but was ${typeof feature.strategies}`);
        } 

        if (typeof feature.enabled !== 'boolean') {
            errors.push(`feature.enabled should be an boolean, but was ${typeof feature.enabled}`);
        }

        if (errors.length > 0) {
            const err = new Error(errors.join(', '));
            // process.nextTick(() => this.emit('error', err));
            this.emit('error2', err)
        }
    }

    fetch () {
        request({
            url: this.url,
            headers: { 'If-None-Match': this.etag },
        }, (error, res, body: string) => {
            if (error) {
                return this.emit('error', error);
            }

            if (res.statusCode === 304) {
                // No new data
                return;
            }

            if (res.statusCode !== 200) {
                return this.emit('error', new Error('Reponse was not statusCode 200'));
            }

            try {
                const payload: any = JSON.parse(body);
                const data: any = pickData(toNewFormat(payload));
                const obj = data.features.reduce((o: Object, feature: FeatureInterface) => {
                    this.validateFeature(feature);
                    o[feature.name] = feature;
                    return o;
                }, {} as Object);
                this.storage.reset(obj);
                this.etag = res.headers.etag;
                this.emit('data');
            } catch (err) {
                this.emit('error', err);
            }
        });
    }

    stop () {
        clearInterval(this.timer);
    }

    getToggle (name: string) : FeatureInterface {
        return this.storage.get(name);
    }
}