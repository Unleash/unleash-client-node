import * as request from 'request';

export interface RequestOptions {
    url: string,
    timeout?: number,
}

export interface GetRequestOptions extends RequestOptions {
    etag?: string,
    appName?: string,
    instanceId?: string,
}

export interface Data {
    [key: string]: any,
}

export interface PostRequestOptions extends RequestOptions {
    json?: Data,
}

export const post = (options : PostRequestOptions, cb) => {
    if (!options.timeout) {
        options.timeout = 10000;
    }
    return request.post(options, cb);
};

export const get = ({ url, etag, appName, instanceId } : GetRequestOptions, cb) => {
    const options = {
        url,
        timeout: 10000,
        headers: {
            'UNLEASH-APPNAME': appName,
            'UNLEASH-INSTANCEID': instanceId,
            'User-Agent': appName,
        },
    };
    if (etag) {
        options.headers['If-None-Match'] = etag;
    }
    return request.get(options, cb);
};
