import * as request from 'request';

interface RequestOptions {
    url: string,
}

interface GetRequestOptions extends RequestOptions {
    etag?: string,
    requestId?: string,
}

export interface Data {
    [key: string]: any,
}

interface PostRequestOptions extends RequestOptions {
    json?: Data,
}

// TODO headers

export const post = (options : PostRequestOptions, cb: Function) => {
    return request.post(options, cb);
};

export const get = ({ url, etag, requestId } : GetRequestOptions, cb: Function) => {
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
