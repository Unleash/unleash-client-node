export interface Context {
    [key: string]: string | undefined | number;
    userId?: string;
    sessionId?: string;
    remoteAddress?: string;
    properties?: any;
}
