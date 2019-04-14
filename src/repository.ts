import { EventEmitter } from 'events';
import { Storage } from './storage';
import { FeatureInterface } from './feature';
import { resolve } from 'url';
import { get } from './request';
import { CustomHeaders } from './unleash';
import { AxiosResponse } from "axios";

type Response = AxiosResponse | any;

export type StorageImpl = typeof Storage;

export interface RepositoryOptions {
    backupPath: string;
    url: string;
    appName: string;
    instanceId: string;
    refreshInterval?: number;
    StorageImpl?: StorageImpl;
    headers?: CustomHeaders;
}

export default class Repository extends EventEmitter implements EventEmitter {
    private timer: NodeJS.Timer | undefined;
    private url: string;
    private storage: Storage;
    private etag: string | undefined;
    private appName: string;
    private instanceId: string;
    private refreshInterval?: number;
    private headers?: CustomHeaders;

    constructor({
        backupPath,
        url,
        appName,
        instanceId,
        refreshInterval,
        StorageImpl = Storage,
        headers,
    }: RepositoryOptions) {
        super();
        this.url = url;
        this.refreshInterval = refreshInterval;
        this.instanceId = instanceId;
        this.appName = appName;
        this.headers = headers;

        this.storage = new StorageImpl({ backupPath, appName });
        this.storage.on('error', err => this.emit('error', err));
        this.storage.on('ready', () => this.emit('ready'));

        process.nextTick(() => this.fetch());
    }

    timedFetch() {
        if (this.refreshInterval != null && this.refreshInterval > 0) {
            this.timer = setTimeout(() => this.fetch(), this.refreshInterval);
            if (process.env.NODE_ENV !== 'test') {
                this.timer.unref();
            }
        }
    }

    validateFeature(feature: FeatureInterface) {
        const errors: string[] = [];
        if (!Array.isArray(feature.strategies)) {
            errors.push(
                `feature.strategies should be an array, but was ${typeof feature.strategies}`,
            );
        }

        if (feature.variants && !Array.isArray(feature.variants)) {
            errors.push(`feature.variants should be an array, but was ${typeof feature.variants}`);
        }

        if (typeof feature.enabled !== 'boolean') {
            errors.push(`feature.enabled should be an boolean, but was ${typeof feature.enabled}`);
        }

        if (errors.length > 0) {
            const err = new Error(errors.join(', '));
            this.emit('error', err);
        }
    }

    fetch() {
        const url = resolve(this.url, './client/features');
        get(
            {
                url,
                etag: this.etag,
                appName: this.appName,
                instanceId: this.instanceId,
                headers: this.headers,
            },
            (error: Error | null, res: Response, body: string) => {
                // start timer for next fetch
                this.timedFetch();

                if (error) {
                    return this.emit('error', error);
                }

                if (res.status === 304) {
                    // No new data
                    return;
                }

                if (!(res.status >= 200 && res.status < 300)) {
                    return this.emit(
                        'error',
                        new Error(`Response was not statusCode 2XX, but was ${res.status}`),
                    );
                }

                try {
                    const data = typeof body === "string" ? JSON.parse(body) : body;
                    const obj = data.features.reduce(
                        (o: { [s: string]: FeatureInterface }, feature: FeatureInterface) => {
                            this.validateFeature(feature);
                            o[feature.name] = feature;
                            return o;
                        },
                        {} as { [s: string]: FeatureInterface },
                    );
                    this.storage.reset(obj);
                    this.etag = Array.isArray(res.headers.etag)
                        ? res.headers.etag.join(' ')
                        : res.headers.etag;
                    this.emit('data');
                } catch (err) {
                    this.emit('error', err);
                }
            },
        );
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.removeAllListeners();
        this.storage.removeAllListeners();
    }

    getToggle(name: string): FeatureInterface {
        return this.storage.get(name);
    }
}
