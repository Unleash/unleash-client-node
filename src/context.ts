export interface Context {
    [key: string]: string | undefined | number;
    userId?: string;
    sessionId?: string;
    remoteAddress?: string;
    environment?: string;
    appName?: string;
    properties?: any;
}
