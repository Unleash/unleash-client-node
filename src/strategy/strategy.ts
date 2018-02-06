import { Context } from '../context';
import { Variant } from '../variant';

export class Strategy {
    public name: string;
    private returnValue: boolean;

    constructor(name: string, returnValue: boolean = false) {
        this.name = name || 'unknown';
        this.returnValue = returnValue;
    }

    isEnabled(parameters: any, context: Context): boolean {
        return this.returnValue;
    }
}

export class Experiment extends Strategy {
    experiment(parameters: any, context: Context): null | Variant {
        return null;
    }
}

export interface StrategyTransportInterface {
    name: string;
    parameters: any;
}
