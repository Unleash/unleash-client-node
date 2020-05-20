import Client from './client';
import Repository, { RepositoryInterface } from './repository';
import Metrics from './metrics';
import { Context } from './context';
import { Strategy, defaultStrategies } from './strategy';
export { Strategy };
import { tmpdir } from 'os';
import { EventEmitter } from 'events';
import { userInfo, hostname } from 'os';
import { FeatureInterface } from './feature';
import { Variant, getDefaultVariant } from './variant';
import { FallbackFunction, createFallbackFunction } from './helpers';

const BACKUP_PATH: string = tmpdir();

export interface CustomHeaders {
    [key: string]: string;
}

export type CustomHeadersFunction = () => Promise<CustomHeaders>;

export interface UnleashConfig {
    appName: string;
    environment?: string;
    instanceId?: string;
    url: string;
    refreshInterval?: number;
    metricsInterval?: number;
    disableMetrics?: boolean;
    backupPath?: string;
    strategies?: Strategy[];
    customHeaders?: CustomHeaders;
    customHeadersFunction?: CustomHeadersFunction;
    timeout?: number;
    repository?: RepositoryInterface;
}

export interface StaticContext {
    appName: string;
    environment: string;
}

export class Unleash extends EventEmitter {
    private repository: RepositoryInterface;
    private client: Client | undefined;
    private metrics: Metrics;
    private staticContext: StaticContext;

    constructor({
        appName,
        environment = 'default',
        instanceId,
        url,
        refreshInterval = 15 * 1000,
        metricsInterval = 60 * 1000,
        disableMetrics = false,
        backupPath = BACKUP_PATH,
        strategies = [],
        repository,
        customHeaders,
        customHeadersFunction,
        timeout,
    }: UnleashConfig) {
        super();

        if (!url) {
            throw new Error('Unleash server URL missing');
        }

        if (url.endsWith('/features')) {
            const oldUrl = url;
            process.nextTick(() =>
                this.emit(
                    'warn',
                    `Unleash server URL "${oldUrl}" should no longer link directly to /features`,
                ),
            );
            url = url.replace(/\/features$/, '');
        }

        if (!url.endsWith('/')) {
            url += '/';
        }

        if (!appName) {
            throw new Error('Unleash client appName missing');
        }

        if (!instanceId) {
            let info;
            try {
                info = userInfo();
            } catch (e) {
                //unable to read info;
            }

            const prefix = info
                ? info.username
                : `generated-${Math.round(Math.random() * 1000000)}-${process.pid}`;
            instanceId = `${prefix}-${hostname()}`;
        }

        this.staticContext = { appName, environment };

        this.repository =
            repository ||
            new Repository({
                backupPath,
                url,
                appName,
                instanceId,
                refreshInterval,
                headers: customHeaders,
                customHeadersFunction,
                timeout,
            });

        strategies = defaultStrategies.concat(strategies);

        this.repository.on('ready', () => {
            this.client = new Client(this.repository, strategies);
            this.client.on('error', err => this.emit('error', err));
            this.client.on('warn', msg => this.emit('warn', msg));
            this.emit('ready');
        });

        this.repository.on('error', err => {
            err.message = `Unleash Repository error: ${err.message}`;
            this.emit('error', err);
        });

        this.repository.on('warn', msg => {
            this.emit('warn', msg);
        });

        this.repository.on('unchanged', () => {
            this.emit('unchanged');
        });

        this.repository.on('changed', data => {
            this.emit('changed', data);
        });

        this.metrics = new Metrics({
            disableMetrics,
            appName,
            instanceId,
            strategies: strategies.map((strategy: Strategy) => strategy.name),
            metricsInterval,
            url,
            headers: customHeaders,
            customHeadersFunction,
            timeout,
        });

        this.metrics.on('error', err => {
            err.message = `Unleash Metrics error: ${err.message}`;
            this.emit('error', err);
        });

        this.metrics.on('warn', msg => {
            this.emit('warn', msg);
        });

        this.metrics.on('count', (name, enabled) => {
            this.emit('count', name, enabled);
        });

        this.metrics.on('sent', payload => {
            this.emit('sent', payload);
        });

        this.metrics.on('registered', payload => {
            this.emit('registered', payload);
        });
    }

    destroy() {
        this.repository.stop();
        this.metrics.stop();
        this.client = undefined;
    }

    isEnabled(name: string, context: Context, fallbackFunction?: FallbackFunction): boolean;
    isEnabled(name: string, context: Context, fallbackValue?: boolean): boolean;
    isEnabled(name: string, context: Context, fallback?: FallbackFunction | boolean): boolean {
        const enhancedContext = Object.assign({}, this.staticContext, context);
        const fallbackFunc = createFallbackFunction(name, enhancedContext, fallback);

        let result;
        if (this.client !== undefined) {
            result = this.client.isEnabled(name, enhancedContext, fallbackFunc);
        } else {
            result = fallbackFunc();
            this.emit(
                'warn',
                `Unleash has not been initialized yet. isEnabled(${name}) defaulted to ${result}`,
            );
        }
        this.count(name, result);
        return result;
    }

    getVariant(name: string, context: any, fallbackVariant?: Variant): Variant {
        const enhancedContext = Object.assign({}, this.staticContext, context);
        let result;
        if (this.client !== undefined) {
            result = this.client.getVariant(name, enhancedContext, fallbackVariant);
        } else {
            result = typeof fallbackVariant !== 'undefined' ? fallbackVariant : getDefaultVariant();
            this.emit(
                'warn',
                `Unleash has not been initialized yet. isEnabled(${name}) defaulted to ${result}`,
            );
        }
        if (result.name) {
            this.countVariant(name, result.name);
        } else {
            this.count(name, result.enabled);
        }

        return result;
    }

    getFeatureToggleDefinition(toggleName: string): FeatureInterface {
        return this.repository.getToggle(toggleName);
    }

    getFeatureToggleDefinitions(): FeatureInterface[] {
        return this.repository.getToggles();
    }

    count(toggleName: string, enabled: boolean) {
        this.metrics.count(toggleName, enabled);
    }

    countVariant(toggleName: string, variantName: string) {
        this.metrics.countVariant(toggleName, variantName);
    }
}
