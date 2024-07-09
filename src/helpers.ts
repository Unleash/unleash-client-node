import * as murmurHash3 from 'murmurhash3js';
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

export function resolveContextValue(context: Context, field: string): string | undefined {
  return context[field]?.toString() ?? context.properties?.[field]?.toString();
}

export function safeName(str: string = '') {
  return str.replace(/\//g, '_');
}

export function generateHashOfConfig(o: Object): string {
  const oAsString = JSON.stringify(o);
  return murmurHash3.x86.hash128(oAsString);
}

export function getAppliedJitter(jitter: number): number {
  const appliedJitter = Math.random() * jitter;
  return Math.random() < 0.5 ? -appliedJitter : appliedJitter;
}
