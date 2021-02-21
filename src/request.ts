import got from 'got';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { CustomHeaders } from './headers';

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

export const getAgent = (url: URL) => (url.protocol === 'https:' ? httpsAgent : httpAgent);
export const buildHeaders = (
  appName: string | undefined,
  instanceId: string | undefined,
  etag: string | undefined,
  contentType: string | undefined,
  custom: CustomHeaders | undefined,
): Record<string, string> => {
  const head: Record<string, string> = {};
  if (appName) {
    head['UNLEASH-APPNAME'] = appName;
    head['User-Agent'] = appName;
  }
  if (instanceId) {
    head['UNLEASH-INSTANCEID'] = instanceId;
  }
  if (etag) {
    head['If-None-Match'] = etag;
  }
  if (contentType) {
    head['Content-Type'] = contentType;
  }
  if (custom) {
    // eslint-disable-next-line no-return-assign
    Object.keys(custom).forEach((k) => (head[k] = custom[k]));
  }
  return head;
};

export const post = ({ url, appName, timeout, instanceId, headers, json }: PostRequestOptions) =>
  got.post(url, {
    timeout: timeout || 10000,
    agent: { http: httpAgent, https: httpsAgent },
    headers: buildHeaders(appName, instanceId, undefined, 'application/json', headers),
    body: JSON.stringify(json),
    responseType: 'json',
  });

export const get = ({ url, etag, appName, timeout, instanceId, headers }: GetRequestOptions) =>
  got.get(url, {
    timeout: timeout || 10000,
    agent: { http: httpAgent, https: httpsAgent },
    headers: buildHeaders(appName, instanceId, etag, undefined, headers),
    responseType: 'json',
  });
