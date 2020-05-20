import { Context } from '../context';
import { resolveContextValue } from '../helpers';

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
