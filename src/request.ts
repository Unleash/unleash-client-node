import { CustomHeaders } from './unleash';

export interface RequestOptions {
    url: string;
    timeout?: number;
    headers?: CustomHeaders;
}

export interface GetRequestOptions extends RequestOptions {
    etag?: string;
    appName?: string;
    instanceId?: string;
}

export interface Data {
    [key: string]: any;
}

export interface PostRequestOptions extends RequestOptions {
    json: Data;
    appName?: string;
    instanceId?: string;
}

export const post = async ({
    url,
    appName,
    timeout,
    instanceId,
    headers,
    json,
}: PostRequestOptions) => {
    return fetch(url, {
        method: 'post',
        keepalive: true,
        headers: Object.assign(
            {
                'UNLEASH-APPNAME': appName,
                'UNLEASH-INSTANCEID': instanceId,
                'User-Agent': appName,
                'content-type': 'application/json',
            },
            headers,
        ),
        body: JSON.stringify(json),
    });
};

export const get = async ({ url, etag, appName, instanceId, headers }: GetRequestOptions) => {
    return fetch(url, {
        headers: Object.assign(
            {
                'UNLEASH-APPNAME': appName,
                'UNLEASH-INSTANCEID': instanceId,
                'User-Agent': appName,
                'if-none-match': etag ? etag : undefined,
            },
            headers,
        ),
    });
};
