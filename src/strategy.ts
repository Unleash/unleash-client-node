'use strict';

export class Strategy {
    public name: string;
    private returnValue: boolean;

    constructor (name: string, returnValue: boolean = false) {
        this.name = name || 'unknown';
        this.returnValue = returnValue;
    }

    isEnabled (parameters: any, context: any) : boolean {
        return this.returnValue;
    }
};

export interface StrategyTransportInterface {
    name: string;
    operator?: string;
    parameters: any;
};
