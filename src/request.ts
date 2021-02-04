import { CustomHeaders } from './unleash';
import fetch from 'node-fetch';
import * as http from 'http';
import * as https from 'https';

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
const httpAgent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 30 * 1000,
    timeout: 10 * 1000,
});

const httpsAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 30 * 1000,
    timeout: 10 * 1000,
});
export const post = ({ url, appName, timeout, instanceId, headers, json }: PostRequestOptions) => {
    return fetch(url, {
        timeout: timeout || 10000,
        method: 'POST',
        agent: url => (url.protocol === 'https' ? httpsAgent : httpAgent),
        headers: Object.assign(
            {
                'UNLEASH-APPNAME': appName,
                'UNLEASH-INSTANCEID': instanceId,
                'User-Agent': appName,
                'Content-Type': 'application/json',
            },
            headers,
        ),
        body: JSON.stringify(json),
    });
};

export const get = ({ url, etag, appName, timeout, instanceId, headers }: GetRequestOptions) => {
    const optHeaders = Object.assign(
        {
            'UNLEASH-APPNAME': appName,
            'UNLEASH-INSTANCEID': instanceId,
            'User-Agent': appName,
        },
        headers,
    );
    if (etag) {
        optHeaders['If-None-Match'] = etag;
    }
    return fetch(url, {
        method: 'GET',
        timeout: timeout || 10000,
        agent: url => (url.protocol === 'https' ? httpsAgent : httpAgent),
        headers: optHeaders,
    });
};
