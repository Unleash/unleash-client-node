import Timer = NodeJS.Timer;

class BrowserTimeout implements Timer {
    private _handle: number;
    
    constructor(handle: number) {
        this._handle = handle;
    }
    
    ref(): void {
    }
    
    refresh(): void {
    }
    
    unref(): void {
    }
    
    clear(): void {
        window.clearInterval(this._handle);
    }
}


export function browserBasedSetTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timer {
    return new BrowserTimeout(window.setTimeout(callback, ms, ...args));
}

export function browserBasedClearInterval(intervalId: NodeJS.Timer): void {
    (intervalId as BrowserTimeout).clear();
}
