'use strict';
import { EventEmitter } from 'events';
import { join } from 'path';
import { writeFile, readFile } from 'fs';

const REPO_VERSION: string = 'schema-v1';
const BACKUP_FILENAME: string = `/unleash-repo-${REPO_VERSION}.json`;

interface EEInterface {
    on(event: string, listener: Function) : this;
    emit(event: string, payload?: any);
}

export class Storage extends EventEmitter implements EEInterface {
    // ready is a "ready"-flag to signal that storage is ready with data, 
    // and to signal to backup not to store fetched backup
    private ready: boolean = false;
    private data: any;
    
    constructor (private backupPath: string) {
        super();
        this.data = {};
        this.load();
    }

    reset (data: any, doPersist: boolean = true) : void {
        const doEmitReady = this.ready === false;
        this.ready = true;
        this.data = data;
        process.nextTick(() => {
            if (doEmitReady) {
                this.emit('ready');
            }
            if (doPersist) {
                this.persist();
            }
        });
    }

    get (key) : any {
        return this.data[key];
    }

    persist () : void {
        writeFile(join(this.backupPath, BACKUP_FILENAME), JSON.stringify(this.data), (err) => {
            if (err) {
                return this.emit('error', err);
            }
            this.emit('persisted', true);
        });
    }

    load () : void {
        readFile(join(this.backupPath, BACKUP_FILENAME), 'utf8', (err, data: string) => {
            if (this.ready) {
                return;
            }

            if (err) {
                if (err.errno !== 34 || err.code !== 'ENOENT') {
                    this.emit('error', err);
                }
                return;
            }

            try {
                this.reset(JSON.parse(data), false);
            } catch (err) {
                this.emit('error', err);
            }
        });
    }
}