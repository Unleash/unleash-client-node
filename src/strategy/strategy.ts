import { Context } from '../context';

function resolveContextValue(context: Context, field: string) {
    if (context[field]) {
        return context[field];
    } else if (context.properties && context.properties[field]) {
        return context.properties[field];
    } else {
        return undefined;
    }
}

export class Strategy {
    public name: string;
    private returnValue: boolean;

    constructor(name: string, returnValue: boolean = false) {
        this.name = name || 'unknown';
        this.returnValue = returnValue;
    }

    checkConstraint(constraint: Constraint, context: Context) {
        const field = constraint.contextName;
        const contextValue = resolveContextValue(context, field);
        const isIn = constraint.values.some(val => val.trim() === contextValue);
        return constraint.operator === Operator.IN ? isIn : !isIn;
    }

    checkConstraints(context: Context, constraints?: Constraint[]) {
        if (!constraints || constraints.length === 0) {
            return true;
        }
        return constraints.every(constraint => this.checkConstraint(constraint, context));
    }

    isEnabled(parameters: any, context: Context): boolean {
        return this.returnValue;
    }

    isEnabledWithConstraints(parameters: any, context: Context, constraints: Constraint[] = []) {
        return this.checkConstraints(context, constraints) && this.isEnabled(parameters, context);
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
    IN = <any>'IN',
    NOT_IN = <any>'NOT_IN',
}
