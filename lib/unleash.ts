'use strict';
import Client from './client';
import Repository from './repository';
import { Strategy } from './strategy';
import { tmpdir } from 'os';
import { EventEmitter } from 'events';

const BACKUP_PATH: string = tmpdir();


/*
    # Client.

    * typescript
    * starte umiddelbart
        - backup fil leses async umiddelbart ( rask timeout / feilhåndtering )
            - så lese/samtidig fra server (SERVER vinner alltid)
                - lagre resultat
            - polling
    * ikke feile, MEN surface errors/logs til tester
    * skal plukke data ut fra payload (ikke validere hele payload)

    # Aggregate strategies:

    * nytt og gammel format
        * normalisere backupfil og server
            * normalisere til nytt format
                strategies: [{ name, parameters }]

*/

interface UnleashConfig {
    url: string,
    refreshIntervall?: number,
    backupPath?: string,
    strategies: Strategy[],
    errorHandler?: (err: any) => any
}

export default function initialize (config: UnleashConfig) {
    return new Unleash(config);
}

export class Unleash extends EventEmitter {

    private repository: Repository;
    private client: Client;

    constructor({
        url,
        refreshIntervall = 15 * 1000,
        backupPath = BACKUP_PATH,
        strategies = [],
        errorHandler = () => {}
    } : UnleashConfig) {
        super();

        if (!url) {
            throw new Error('Unleash server URL missing');
        }

        this.repository = new Repository(backupPath, url, refreshIntervall);

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
        if (this.repository) {
            this.repository.stop();
        }
        this.client = undefined;
    }

    isEnabled (name: string, context: any) {
        if (this.client) {
            return this.client.isEnabled(name, context);
        } else {
            this.emit('warning', `${Date.now()} WARN: Unleash has not been initalized yet. isEnabled(${name}) defaulted to false`);
            return false;
        }
    }
}
