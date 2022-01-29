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
  inverted: boolean;
  values: string[];
  value?: string | number | Date;
}

export enum Operator {
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  STR_ENDS_WITH = 'STR_ENDS_WITH',
  STR_STARTS_WITH = 'STR_STARTS_WITH',
  STR_CONTAINS = 'STR_CONTAINS',
  NUM_EQ = 'NUM_EQ',
  NUM_GT = 'NUM_GT',
  NUM_GTE = 'NUM_GTE',
  NUM_LT = 'NUM_LT',
  NUM_LTE = 'NUM_LTE',
}

export type OperatorImpl = (constraint: Constraint, context: Context) => boolean;

const cleanValues = (values: string[]) => values
  .filter(v => !!v)
  .map(v => v.trim())

const InOperator = (constraint: Constraint, context: Context) => {
  const field = constraint.contextName;
  const values = cleanValues(constraint.values);
  const contextValue = resolveContextValue(context, field);
  if(!contextValue) {
    return false;
  }
  
  const isIn = values.some(val => val === contextValue);
  return constraint.operator === Operator.IN ? isIn : !isIn;
}

const StringOperator = (constraint: Constraint, context: Context) => {
  const field = constraint.contextName;
  const {operator} = constraint;
  const values = cleanValues(constraint.values);
  const contextValue = resolveContextValue(context, field);
  if(!contextValue) {
    return false;
  }

  if(operator === Operator.STR_STARTS_WITH) {
    return values.some(val => contextValue.startsWith(val)); 
  } if(operator === Operator.STR_ENDS_WITH) {
    return values.some(val => contextValue.endsWith(val));
  } if(operator === Operator.STR_CONTAINS) {
    return values.some(val => contextValue.includes(val));
  } 
    return false;
}

const NumberOperator = (constraint: Constraint, context: Context) => {
  const field = constraint.contextName;
  const {operator} = constraint;
  const value = Number(constraint.value);
  const contextValue = Number(resolveContextValue(context, field));

  if(Number.isNaN(value) || Number.isNaN(contextValue)) {
    return false;
  }

  if(operator === Operator.NUM_EQ) {
    return contextValue === value; 
  } if(operator === Operator.NUM_GT) {
    return contextValue > value;
  } if(operator === Operator.NUM_GTE) {
    return contextValue >= value;
  } if(operator === Operator.NUM_LT) {
    return contextValue < value;
  } if(operator === Operator.NUM_LTE) {
    return contextValue <= value;
  }
    return false;
}

const operators = new Map<Operator, OperatorImpl>();
operators.set(Operator.IN, InOperator);
operators.set(Operator.NOT_IN, InOperator);
operators.set(Operator.STR_STARTS_WITH, StringOperator);
operators.set(Operator.STR_ENDS_WITH, StringOperator);
operators.set(Operator.STR_CONTAINS, StringOperator);
operators.set(Operator.NUM_EQ, NumberOperator);
operators.set(Operator.NUM_LT, NumberOperator);
operators.set(Operator.NUM_LTE, NumberOperator);
operators.set(Operator.NUM_GT, NumberOperator);
operators.set(Operator.NUM_GTE, NumberOperator);

export class Strategy {
  public name: string;

  private returnValue: boolean;

  constructor(name: string, returnValue: boolean = false) {
    this.name = name || 'unknown';
    this.returnValue = returnValue;
  }

  

  checkConstraint(constraint: Constraint, context: Context) {
    const evaluator = operators.get(constraint.operator);
    
    if(!evaluator) {
      return false;
    }
    
    if(constraint.inverted) {
      return !evaluator(constraint, context);
    } 
    
    return evaluator(constraint, context);
    
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
