import { Context } from '../context';
import { resolveContextValue } from '../helpers';

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
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  ENDS_WITH = 'ENDS_WITH',
  STARTS_WITH = 'STARTS_WITH',
  CONTAINS = 'CONTAINS',
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
    switch (constraint.operator) {
      case Operator.IN:
      case Operator.NOT_IN: {
        const isIn = constraint.values.some((val) => val.trim() === contextValue);
        return constraint.operator === Operator.IN ? isIn : !isIn;
      }
      case Operator.ENDS_WITH: {
        if(!contextValue) {
          return false;
        }
        return constraint.values.some((val) => contextValue.endsWith(val.trim()));
      }
      case Operator.STARTS_WITH: {
        if(!contextValue) {
          return false;
        }
        return constraint.values.some((val) => contextValue.startsWith(val.trim()));
      }
      case Operator.CONTAINS: {
        if(!contextValue) {
          return false;
        }
        return constraint.values.some((val) => contextValue.includes(val.trim()));
      }
      default: 
        return false;
    }
    
  }

  checkConstraints(context: Context, constraints?: Constraint[]) {
    if (!constraints || constraints.length === 0) {
      return true;
    }
    return constraints.every((constraint) => this.checkConstraint(constraint, context));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isEnabled(parameters: any, context: Context): boolean {
    return this.returnValue;
  }

  isEnabledWithConstraints(parameters: any, context: Context, constraints: Constraint[] = []) {
    return this.checkConstraints(context, constraints) && this.isEnabled(parameters, context);
  }
}
