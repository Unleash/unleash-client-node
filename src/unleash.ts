'use strict';
import Client from './client';
import Repository from './repository';
import Metrics from './metrics';
import { Strategy } from './strategy';
export { Strategy as Strategy } from './strategy';
import { tmpdir } from 'os';
import { EventEmitter } from 'events';

const BACKUP_PATH: string = tmpdir();

export interface UnleashConfig {
    appName?: string,
    instanceId?: string,
    url: string;
    refreshInterval?: number;
    metricsInterval?: number,
    backupPath?: string;
    strategies: Strategy[];
    errorHandler?: (err: any) => any;
};

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
        backupPath = BACKUP_PATH,
        strategies = [],
        errorHandler = () => {}
    } : UnleashConfig) {
        super();

        if (!url) {
            throw new Error('Unleash server URL missing');
        }

        if (!appName) {
            throw new Error('Unleash client appName missing');
        }

        if (!instanceId) {
            instanceId = `generated-${Math.round(Math.random() * 1000000)}-${process.pid}`;
        }

        const requestId: string = `${appName}:${instanceId}`;
        this.repository = new Repository(backupPath, url, requestId, refreshInterval);

        strategies = [new Strategy('default', true)].concat(strategies);

        this.repository.on('ready', () => {
            this.client = new Client(this.repository, strategies, errorHandler);
            this.emit('ready');
        });

        this.repository.on('error', (err) => {
            err.message = `Unleash Repository error: ${err.message}`;
            this.emit('error', err);
        });

        this.repository.on('warn', (msg) => {
            this.emit('warn', msg);
        });

        this.metrics = new Metrics({
            appName,
            instanceId,
            strategies: strategies.map((strategy: Strategy) => strategy.name),
            metricsInterval,
            url
        });

        this.metrics.on('error', (err) => {
            err.message = `Unleash Metrics error: ${err.message}`;
            this.emit('error', err);
        });

        this.metrics.on('warn', (msg) => {
            this.emit('warn', msg);
        });
    }

    destroy () {
        this.repository.stop();
        this.client = undefined;
    }

    isEnabled (name: string, context: any, fallbackValue?: boolean) : boolean {
        let result;
        if (this.client !== undefined) {
            result = this.client.isEnabled(name, context, fallbackValue);
        } else {
            result = typeof fallbackValue === 'boolean' ? fallbackValue : false;
            this.emit('warn', `Unleash has not been initialized yet. isEnabled(${name}) defaulted to ${result}`);
        }
        this.metrics.count(name, result);
        return result;
    }
};
