export function nodeBasedSetTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timer {
    return setTimeout(callback, ms, ...args);
}

export function nodeBasedClearInterval(intervalId: NodeJS.Timer): void {
    clearInterval(intervalId);
}

