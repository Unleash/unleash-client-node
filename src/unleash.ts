import Client from './client';
import Repository, { RepositoryInterface } from './repository';
import Metrics from './metrics';
import { Context } from './context';
import { Strategy, defaultStrategies } from './strategy';
export { Strategy };
import { EventEmitter } from 'events';
import { FeatureInterface } from './feature';
import { Variant, getDefaultVariant } from './variant';
import { FallbackFunction, createFallbackFunction } from './helpers';
import { IStorage } from './storage';

export interface CustomHeaders {
    [key: string]: string;
}

export type CustomHeadersFunction = () => Promise<CustomHeaders>;

export interface UnleashConfig {
    appName: string;
    environment?: string;
    instanceId: string;
    url: string;
    disableMetrics?: boolean;
    backupPath?: string;
    strategies?: Strategy[];
    customHeaders?: CustomHeaders;
    customHeadersFunction?: CustomHeadersFunction;
    timeout?: number;
    repository?: RepositoryInterface;
    storage: IStorage;
}

export interface StaticContext {
    appName: string;
    environment: string;
}

export class Unleash extends EventEmitter {
    repository: RepositoryInterface;
    client: Client | undefined;
    metrics: Metrics;
    staticContext: StaticContext;

    constructor({
        appName,
        environment = 'default',
        instanceId,
        url,
        disableMetrics = false,
        strategies = [],
        repository,
        customHeaders,
        customHeadersFunction,
        storage,
        timeout,
    }: UnleashConfig) {
        super();

        if (!url) {
            throw new Error('Unleash server URL missing');
        }

        if (url.endsWith('/features')) {
            const oldUrl = url;
            this.emit(
                'warn',
                `Unleash server URL "${oldUrl}" should no longer link directly to /features`,
            ),
                (url = url.replace(/\/features$/, ''));
        }

        if (!url.endsWith('/')) {
            url += '/';
        }

        if (!appName) {
            throw new Error('Unleash client appName missing');
        }

        if (!instanceId) {
            throw new Error('Unleash client instanceId missing');
        }

        this.staticContext = { appName, environment };

        this.repository =
            repository ||
            new Repository({
                storage,
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
