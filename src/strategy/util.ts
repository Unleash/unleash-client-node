import { createHash } from 'crypto';

export function normalizedValue(id: string, groupId: string): number {
    const value: string = `${groupId}:${id}`;
    const hash = createHash('md5').update(value).digest('hex');
    const hashCode = parseInt(hash.substring(hash.length - 4), 16);
    return hashCode % 100;
}
