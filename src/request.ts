import * as request from 'request';

export interface RequestOptions {
    url: string;
    timeout?: number;
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
    json?: Data;
    appName?: string;
    instanceId?: string;
}

export const post = ({ url, appName, timeout, instanceId }: PostRequestOptions, cb) => {
    const options = {
        url,
        timeout: timeout || 10000,
        headers: {
            'UNLEASH-APPNAME': appName,
            'UNLEASH-INSTANCEID': instanceId,
            'User-Agent': appName,
        },
    };
    return request.post(options, cb);
};

export const get = ({ url, etag, appName, timeout, instanceId }: GetRequestOptions, cb) => {
    const options = {
        url,
        timeout: timeout || 10000,
        headers: {
            'UNLEASH-APPNAME': appName,
            'UNLEASH-INSTANCEID': instanceId,
            'User-Agent': appName
        }
    };
    if (etag) {
        options.headers['If-None-Match'] = etag;
    }
    return request.get(options, cb);
};
