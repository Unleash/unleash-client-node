import * as fetch from 'make-fetch-happen';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { getProxyForUrl } from 'proxy-from-env';
import { CustomHeaders } from './headers';
import { HttpOptions } from './http-options';
const details = require('./details.json');

export interface RequestOptions {
  url: string;
  timeout?: number;
  headers?: CustomHeaders;
}

export interface GetRequestOptions extends RequestOptions {
  etag?: string;
  appName?: string;
  instanceId?: string;
  connectionId: string;
  supportedSpecVersion?: string;
  httpOptions?: HttpOptions;
}

export interface Data {
  [key: string]: any;
}

export interface PostRequestOptions extends RequestOptions {
  json: Data;
  appName?: string;
  instanceId?: string;
  connectionId?: string;
  httpOptions?: HttpOptions;
}

const httpAgentOptions: http.AgentOptions = {
  keepAlive: true,
  keepAliveMsecs: 30 * 1000,
  timeout: 10 * 1000,
};

const httpNoProxyAgent = new http.Agent(httpAgentOptions);
const httpsNoProxyAgent = new https.Agent(httpAgentOptions);

export const getDefaultAgent = (url: URL) => {
  const proxy = getProxyForUrl(url.href);
  const isHttps = url.protocol === 'https:';

  if (!proxy || proxy === '') {
    return isHttps ? httpsNoProxyAgent : httpNoProxyAgent;
  }

  return isHttps
    ? new HttpsProxyAgent(proxy, httpAgentOptions)
    : new HttpProxyAgent(proxy, httpAgentOptions);
};

type HeaderOptions = {
  appName?: string;
  instanceId?: string;
  etag?: string;
  contentType?: string;
  custom?: CustomHeaders;
  specVersionSupported?: string;
  connectionId?: string;
};

export const buildHeaders = ({
  appName,
  instanceId,
  etag,
  contentType,
  custom,
  specVersionSupported,
  connectionId,
}: HeaderOptions): Record<string, string> => {
  const head: Record<string, string> = {};
  if (appName) {
    // TODO: delete
    head['UNLEASH-APPNAME'] = appName;
    // TODO: delete
    head['User-Agent'] = appName;
    head['x-unleash-appname'] = appName;
  }
  if (connectionId) {
    head['x-unleash-connection-id'] = connectionId;
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
  if (specVersionSupported) {
    head['Unleash-Client-Spec'] = specVersionSupported;
  }
  const version = details.version;
  head['x-unleash-sdk'] = `unleash-node@${version}`;
  if (custom) {
    Object.assign(head, custom);
  }
  return head;
};

export const post = ({
  url,
  appName,
  timeout,
  instanceId,
  connectionId,
  headers,
  json,
  httpOptions,
}: PostRequestOptions) =>
  fetch(url, {
    timeout: timeout || 10000,
    method: 'POST',
    agent: httpOptions?.agent || getDefaultAgent,
    headers: buildHeaders({
      appName,
      instanceId,
      connectionId,
      etag: undefined,
      contentType: 'application/json',
      custom: headers,
    }),
    body: JSON.stringify(json),
    strictSSL: httpOptions?.rejectUnauthorized,
  });

export const get = ({
  url,
  etag,
  appName,
  timeout,
  instanceId,
  connectionId,
  headers,
  httpOptions,
  supportedSpecVersion,
}: GetRequestOptions) =>
  fetch(url, {
    method: 'GET',
    timeout: timeout || 10_000,
    agent: httpOptions?.agent || getDefaultAgent,
    headers: buildHeaders({
      appName,
      instanceId,
      etag,
      contentType: undefined,
      custom: headers,
      specVersionSupported: supportedSpecVersion,
      connectionId,
    }),
    retry: {
      retries: 2,
      maxTimeout: timeout || 10_000,
    },
    strictSSL: httpOptions?.rejectUnauthorized,
  });
