import { EventEmitter } from 'events';
import { Storage } from './storage';
import { FeatureInterface } from './feature';
import { resolve } from 'url';
import { get } from './request';
import { CustomHeaders, CustomHeadersFunction } from './unleash';

export type StorageImpl = typeof Storage;

export interface RepositoryInterface extends EventEmitter {
    getToggle(name: string): FeatureInterface;
    getToggles(): FeatureInterface[];
    stop(): void;
}

export interface RepositoryOptions {
    backupPath: string;
    url: string;
    appName: string;
    instanceId: string;
    refreshInterval?: number;
    StorageImpl?: StorageImpl;
    timeout?: number;
    headers?: CustomHeaders;
    customHeadersFunction?: CustomHeadersFunction;
}

export default class Repository extends EventEmitter implements EventEmitter {
    private timer?: ReturnType<typeof setTimeout>;
    private url: string;
    private storage: Storage;
    private etag: string | undefined;
    private appName: string;
    private instanceId: string;
    private refreshInterval?: number;
    private headers?: CustomHeaders;
    private customHeadersFunction?: CustomHeadersFunction;
    private timeout?: number;
    private stopped = false;

    constructor({
        backupPath,
        url,
        appName,
        instanceId,
        refreshInterval,
        StorageImpl = Storage,
        timeout,
        headers,
        customHeadersFunction,
    }: RepositoryOptions) {
        super();
        this.url = url;
        this.refreshInterval = refreshInterval;
        this.instanceId = instanceId;
        this.appName = appName;
        this.headers = headers;
        this.timeout = timeout;
        this.customHeadersFunction = customHeadersFunction;

        this.storage = new StorageImpl({ backupPath, appName });
        this.storage.on('error', err => this.emit('error', err));
        this.storage.on('ready', () => this.emit('ready'));

        setImmediate(() => this.fetch());
    }

    timedFetch() {
        if (this.refreshInterval != null && this.refreshInterval > 0) {
            this.timer = setTimeout(() => this.fetch(), this.refreshInterval);
            if (process.env.NODE_ENV !== 'test' && typeof this.timer.unref === 'function') {
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

    async fetch() {
        if (this.stopped) {
            return;
        }
        const url = resolve(this.url, './client/features');

        const headers = this.customHeadersFunction
            ? await this.customHeadersFunction()
            : this.headers;

        try {
            const fetchResult = await get({
                url,
                etag: this.etag,
                appName: this.appName,
                timeout: this.timeout,
                instanceId: this.instanceId,
                headers,
            });

            // start timer for next fetch
            this.timedFetch();

            if (fetchResult.status === 304) {
                // No new data
                this.emit('unchanged');
                return;
            }

            if (!(fetchResult.status >= 200 && fetchResult.status < 300)) {
                return this.emit(
                    'error',
                    new Error(`Response was not statusCode 2XX, but was ${fetchResult.status}`),
                );
            }

            const data = await fetchResult.json();
            const obj = data.features.reduce(
                (o: { [s: string]: FeatureInterface }, feature: FeatureInterface) => {
                    this.validateFeature(feature);
                    o[feature.name] = feature;
                    return o;
                },
                {} as { [s: string]: FeatureInterface },
            );
            this.storage.reset(obj);
            const etag = fetchResult.headers.get('etag') || '';
            this.etag = Array.isArray(etag) ? etag.join(' ') : etag;
            this.emit('changed', this.storage.getAll());
        } catch (err) {
            this.emit('error', err);
        }
    }

    stop() {
        this.stopped = true;
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.removeAllListeners();
        this.storage.removeAllListeners();
    }

    getToggle(name: string): FeatureInterface {
        return this.storage.get(name);
    }

    getToggles(): FeatureInterface[] {
        const toggles = this.storage.getAll();
        return Object.keys(toggles).map(key => toggles[key]);
    }
}
