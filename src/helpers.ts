import { Context } from './context';

export type FallbackFunction = (name: string, context: Context) => boolean;

export function createFallbackFunction(
  name: string,
  context: Context,
  fallback?: FallbackFunction | boolean,
): Function {
  if (typeof fallback === 'function') {
    return () => fallback(name, context);
  }
  if (typeof fallback === 'boolean') {
    return () => fallback;
  }
  return () => false;
}

export function resolveContextValue(context: Context, field: string) {
  if (context[field]) {
    return context[field];
  }
  if (context.properties && context.properties[field]) {
    return context.properties[field];
  }
  return undefined;
}

export function safeAppName(appName: string = '') {
  return appName.replace(/\//g, '_');
}
