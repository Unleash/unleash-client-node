/**
 * This function generates a UUID using Math.random().
 * The distribution of unique values is not guaranteed to be as robust
 * as with a crupto module but works across all platforms (Node, React Native, browser JS).
 *
 * We use it for connection id generation which is not critical for security.
 */
export const uuidv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
