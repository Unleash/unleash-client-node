import * as murmurHash3 from 'murmurhash3js';

export function normalizedValue(id: string, groupId: string, normalizer = 100): number {
    // Type definitions is wrong, see https://github.com/DefinitelyTyped/DefinitelyTyped/pull/31761
    return (((murmurHash3.x86.hash32(`${groupId}:${id}`) as unknown) as number) % normalizer) + 1;
}
