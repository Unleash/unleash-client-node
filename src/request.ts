import fetch, { Headers } from 'node-fetch';
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
): Headers => {
  const head = new Headers();
  if (appName) {
    head.append('UNLEASH-APPNAME', appName);
    head.append('User-Agent', appName);
  }
  if (instanceId) {
    head.append('UNLEASH-INSTANCEID', instanceId);
  }
  if (etag) {
    head.append('If-None-Match', etag);
  }
  if (contentType) {
    head.append('Content-Type', contentType);
  }
  if (custom) {
    Object.keys(custom).forEach((k) => head.append(k, custom[k]));
  }
  return head;
};

export const post = ({ url, appName, timeout, instanceId, headers, json }: PostRequestOptions) =>
  fetch(url, {
    timeout: timeout || 10000,
    method: 'POST',
    agent: getAgent,
    headers: buildHeaders(appName, instanceId, undefined, 'application/json', headers),
    body: JSON.stringify(json),
  });

export const get = ({ url, etag, appName, timeout, instanceId, headers }: GetRequestOptions) =>
  fetch(url, {
    method: 'GET',
    timeout: timeout || 10000,
    agent: getAgent,
    headers: buildHeaders(appName, instanceId, etag, undefined, headers),
  });
