export interface Context {
    [key: string]: string | undefined | number;
    userId?: string;
    sessionId?: string;
    remoteAddress?: string;
    environment?: string;
    application?: string;
    featureToggle?: string;
    properties?: any;
}
