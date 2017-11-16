import { murmurHash3 } from 'murmurhash3js';

export function normalizedValue(id: string, groupId: string, normalizer = 100): number {
    return murmurHash3.x86.hash32(`${groupId}:${id}`) % normalizer + 1;
}
