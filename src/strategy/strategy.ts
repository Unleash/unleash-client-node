import { Context } from '../context';

export class Strategy {
    public name: string;
    private returnValue: boolean;

    constructor(name: string, returnValue: boolean = false) {
        this.name = name || 'unknown';
        this.returnValue = returnValue;
    }

    isEnabled(parameters: any, context: Context, constraints?: Constraint[]): boolean {
        return this.returnValue;
    }
}

export interface StrategyTransportInterface {
    name: string;
    parameters: any;
    constraints: Constraint[];
}

export interface Constraint {
    contextName: string;
    operator: Operator;
    values: string[];
}

export enum Operator {
    IN,
    NOT_IN,
}
