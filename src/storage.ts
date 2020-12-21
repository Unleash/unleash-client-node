import { EventEmitter } from 'events';
export interface IStorage extends EventEmitter {
    get(key: string): any;
    getAll(): any;
    load(): void;
}

export class NoopStorage extends EventEmitter implements IStorage {
    data: any;
    constructor() {
        super();
        this.data = {};
        this.load();
    }

    safeAppName(appName: string = '') {
        return appName.replace(/\//g, '_');
    }

    reset(data: any, doPersist: boolean = true): void {
        this.data = data;
        this.emit('ready');
    }

    get(key: string): any {
        return this.data[key];
    }

    getAll(): any {
        return this.data;
    }

    load(): void {}
}
