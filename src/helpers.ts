import { Context } from './context';

export type FallbackFunction = (name: string, context: Context) => boolean;

export function createFallbackFunction(
    name: string,
    context: Context,
    fallback?: FallbackFunction | boolean,
): Function {
    if (typeof fallback === 'function') {
        return () => fallback(name, context);
    } else if (typeof fallback === 'boolean') {
        return () => fallback;
    } else {
        return () => false;
    }
}

export function resolveContextValue(context: Context, field: string) {
    if (context[field]) {
        return context[field];
    } else if (context.properties && context.properties[field]) {
        return context.properties[field];
    } else {
        return undefined;
    }
}
