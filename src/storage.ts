import { EventEmitter } from 'events';
import { join } from 'path';
import { writeFile, readFile } from 'fs';

export interface StorageOptions {
    backupPath: string;
    appName: string;
}

export class Storage extends EventEmitter implements EventEmitter {
    // ready is a "ready"-flag to signal that storage is ready with data,
    // and to signal to backup not to store fetched backup
    private ready: boolean = false;
    private data: any;
    private path: string;

    constructor({ backupPath, appName }: StorageOptions) {
        super();
        this.data = {};
        this.path = join(backupPath, `/unleash-repo-schema-v1-${this.safeAppName(appName)}.json`);
        this.load();
    }

    safeAppName(appName: string = '') {
        return appName.replace(/\//g, '_');
    }

    reset(data: any, doPersist: boolean = true): void {
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

    get(key): any {
        return this.data[key];
    }

    persist(): void {
        writeFile(this.path, JSON.stringify(this.data), err => {
            if (err) {
                return this.emit('error', err);
            }
            this.emit('persisted', true);
        });
    }

    load(): void {
        readFile(this.path, 'utf8', (err, data: string) => {
            if (this.ready) {
                return;
            }

            if (err) {
                if (err.code !== 'ENOENT') {
                    this.emit('error', err);
                }
                return;
            }

            try {
                this.reset(JSON.parse(data), false);
            } catch (err) {
                err.message = `Unleash storage failed parsing file ${this.path}: ${err.message}`;
                this.emit('error', err);
            }
        });
    }
}
