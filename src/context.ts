export interface Propeties {
    [key: string]: string | undefined | number;
}

export interface Context {
    [key: string]: string | undefined | number | Propeties;
    userId?: string;
    sessionId?: string;
    remoteAddress?: string;
    environment?: string;
    appName?: string;
    properties?: Propeties;
}
