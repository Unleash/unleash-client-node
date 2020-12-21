import { EventEmitter } from 'events';
import { IStorage } from './storage';
import { FeatureInterface } from './feature';

export interface RepositoryInterface extends EventEmitter {
    getToggle(name: string): FeatureInterface;
    getToggles(): FeatureInterface[];
}

export interface RepositoryOptions {
    storage: IStorage;
}

export default class Repository extends EventEmitter implements RepositoryInterface {
    private storage: IStorage;

    constructor({ storage }: RepositoryOptions) {
        super();
        this.storage = storage;
        this.storage.on('ready', () => this.emit('ready'));
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

    stop() {
        this.removeAllListeners();
    }

    getToggle(name: string): FeatureInterface {
        return this.storage.get(name);
    }

    getToggles(): FeatureInterface[] {
        const toggles = this.storage.getAll();
        return Object.keys(toggles).map(key => toggles[key]);
    }
}
