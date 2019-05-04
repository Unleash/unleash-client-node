import { CustomHeaders } from './unleash';
import axios, { AxiosResponse } from 'axios';

type RequestCallback<T = any> = (
    error: Error | null,
    response: AxiosResponse<T> | null,
    data: any,
) => void;

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

const isA2XXResponse = (res: any) => res.status >= 200 && res.status < 300;
const isAValidNon2XXResponse = (res: any) => res && !isA2XXResponse(res);

const attachCallbackTo = <T = any>(promise: Promise<AxiosResponse<T>>, cb: RequestCallback) =>
    promise
        .then(response => cb(null, response, response.data))
        .catch(reason => {
            const res = reason.response;
            const error = isAValidNon2XXResponse(res) ? null : reason;
            cb(error, res, res && res.data);
        });

const deleteUndefinedHeaders = (headers: any) =>
    //TODO: Travis runs the build on node6, which does not support Object.entries
    Object.keys(headers)
        .map(key => [key, headers[key]])
        .filter(([key, value]) => value === undefined)
        .forEach(([key]) => delete headers[key]);

export const post = (
    { url, appName, timeout, instanceId, headers, json }: PostRequestOptions,
    cb: RequestCallback,
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

    deleteUndefinedHeaders(options.headers);
    return attachCallbackTo(axios.post(url, json, options), cb);
};

export const get = (
    { url, etag, appName, timeout, instanceId, headers }: GetRequestOptions,
    cb: RequestCallback,
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

    deleteUndefinedHeaders(options.headers);
    return attachCallbackTo(axios.get(url, options), cb);
};
