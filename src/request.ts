import * as request from 'request';

export interface RequestOptions {
    url: string,
}

export interface GetRequestOptions extends RequestOptions {
    etag?: string,
    requestId?: string,
}

export interface Data {
    [key: string]: any,
}

export interface PostRequestOptions extends RequestOptions {
    json?: Data,
}

export const post = (options : PostRequestOptions, cb) => {
    return request.post(options, cb);
};

export const get = ({ url, etag, requestId } : GetRequestOptions, cb) => {
    const options = {
        url,
        requestId,
        headers: {
            'UNLEASH-ID': requestId,
        },
    };
    if (etag) {
        options.headers['If-None-Match'] = etag;
    }
    return request.get(options, cb);
};
