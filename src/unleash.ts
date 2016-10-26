'use strict';
import Client from './client';
import Repository from './repository';
import { Strategy } from './strategy';
export { Strategy as Strategy } from './strategy';
import { tmpdir } from 'os';
import { EventEmitter } from 'events';

const BACKUP_PATH: string = tmpdir();

export interface UnleashConfig {
    url: string;
    refreshInterval?: number;
    backupPath?: string;
    strategies: Strategy[];
    errorHandler?: (err: any) => any;
};

export class Unleash extends EventEmitter {

    private repository: Repository;
    private client: Client | undefined;

    constructor({
        url,
        refreshInterval = 15 * 1000,
        backupPath = BACKUP_PATH,
        strategies = [],
        errorHandler = () => {}
    } : UnleashConfig) {
        super();

        if (!url) {
            throw new Error('Unleash server URL missing');
        }

        this.repository = new Repository(backupPath, url, refreshInterval);

        this.repository.on('error', (err) => {
            this.emit('error', err);
        });

        strategies = [new Strategy('default', true)].concat(strategies);

        this.repository.on('ready', () => {
            this.client = new Client(this.repository, strategies, errorHandler);
            this.emit('ready');
        });
    }

    destroy () {
        this.repository.stop();
        this.client = undefined;
    }

    isEnabled (name: string, context: any, fallbackValue?: boolean) : boolean {
        if (this.client !== undefined) {
            return this.client.isEnabled(name, context, fallbackValue);
        } else {
            const returnValue = typeof fallbackValue === 'boolean' ? fallbackValue : false;
            this.emit('warn', `Unleash has not been initialized yet. isEnabled(${name}) defaulted to ${returnValue}`);
            return returnValue;
        }
    }
};
