import Client from './client';
import Repository from './repository';
import Metrics from './metrics';
import { Strategy, defaultStrategies } from './strategy/index';
export { Strategy } from './strategy/index';
import { tmpdir } from 'os';
import { EventEmitter } from 'events';
import { userInfo, hostname } from 'os';
import { FeatureInterface } from './feature';
import { Variant } from './variant';

const BACKUP_PATH: string = tmpdir();

export interface CustomHeaders {
    [key: string]: string;
}

export interface UnleashConfig {
    appName: string;
    instanceId?: string;
    url: string;
    refreshInterval?: number;
    metricsInterval?: number;
    disableMetrics?: boolean;
    backupPath?: string;
    strategies: Strategy[];
    customHeaders?: CustomHeaders;
}

export class Unleash extends EventEmitter {
    private repository: Repository;
    private client: Client | undefined;
    private metrics: Metrics;

    constructor({
        appName,
        instanceId,
        url,
        refreshInterval = 15 * 1000,
        metricsInterval = 60 * 1000,
        disableMetrics = false,
        backupPath = BACKUP_PATH,
        strategies = [],
        customHeaders,
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
                info = {};
            }

            const prefix = info.username
                ? info.username
                : `generated-${Math.round(Math.random() * 1000000)}-${process.pid}`;
            instanceId = `${prefix}-${hostname()}`;
        }

        this.repository = new Repository({
            backupPath,
            url,
            appName,
            instanceId,
            refreshInterval,
            headers: customHeaders,
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

        this.metrics = new Metrics({
            disableMetrics,
            appName,
            instanceId,
            strategies: strategies.map((strategy: Strategy) => strategy.name),
            metricsInterval,
            url,
            headers: customHeaders,
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

    isEnabled(name: string, context: any, fallbackValue?: boolean): boolean {
        let result;
        if (this.client !== undefined) {
            result = this.client.isEnabled(name, context, fallbackValue);
        } else {
            result = typeof fallbackValue === 'boolean' ? fallbackValue : false;
            this.emit(
                'warn',
                `Unleash has not been initialized yet. isEnabled(${name}) defaulted to ${result}`,
            );
        }
        this.count(name, result);
        return result;
    }

    getFeatureToggleDefinition(toggleName: string): FeatureInterface {
        return this.repository.getToggle(toggleName);
    }

    count(toggleName: string, enabled: boolean) {
        this.metrics.count(toggleName, enabled);
    }

    experiment(name: string, context: any, fallbackVariant?: Variant): null | Variant {
        let result;
        if (this.client !== undefined) {
            result = this.client.experiment(name, context, fallbackVariant);
        } else {
            result = typeof fallbackVariant === 'object' ? fallbackVariant : null;
            this.emit(
                'warn',
                `Unleash has not been initialized yet. experiment(${name}) defaulted to ${result}`,
            );
        }
        return result;
    }
}
