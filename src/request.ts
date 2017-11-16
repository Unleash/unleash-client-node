import * as request from 'request';
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

export const post = (
    { url, appName, timeout, instanceId, headers, json }: PostRequestOptions,
    cb,
) => {
    const options = {
        url,
        timeout: timeout || 10000,
        headers: Object.assign(
            {
                'UNLEASH-APPNAME': appName,
                'UNLEASH-INSTANCEID': instanceId,
                'User-Agent': appName,
            },
            headers,
        ),
        json,
    };
    return request.post(options, cb);
};

export const get = (
    { url, etag, appName, timeout, instanceId, headers }: GetRequestOptions,
    cb,
) => {
    const options = {
        url,
        timeout: timeout || 10000,
        headers: Object.assign(
            {
                'UNLEASH-APPNAME': appName,
                'UNLEASH-INSTANCEID': instanceId,
                'User-Agent': appName,
            },
            headers,
        ),
    };
    if (etag) {
        options.headers['If-None-Match'] = etag;
    }
    return request.get(options, cb);
};
