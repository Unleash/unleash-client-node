import * as fetch from 'make-fetch-happen';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { CustomHeaders } from './headers';
import { HttpOptions } from './http-options';

export interface RequestOptions {
  url: string;
  timeout?: number;
  headers?: CustomHeaders;
}

export interface GetRequestOptions extends RequestOptions {
  etag?: string;
  appName?: string;
  instanceId?: string;
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
  httpOptions?: HttpOptions;
}

const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;

const httpAgentOptions: http.AgentOptions = {
  keepAlive: true,
  keepAliveMsecs: 30 * 1000,
  timeout: 10 * 1000,
};

const httpAgent = httpProxy
  ? new HttpProxyAgent(httpProxy, httpAgentOptions)
  : new http.Agent(httpAgentOptions);

const httpsAgent = httpsProxy
  ? new HttpsProxyAgent(httpsProxy, httpAgentOptions)
  : new https.Agent(httpAgentOptions);

export const getDefaultAgent = (url: URL) => (url.protocol === 'https:' ? httpsAgent : httpAgent);
export const buildHeaders = (
  appName?: string,
  instanceId?: string,
  etag?: string,
  contentType?: string,
  custom?: CustomHeaders,
  specVersionSupported?: string,
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
  if (specVersionSupported) {
    head['Unleash-Client-Spec'] = specVersionSupported;
  }
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
  headers,
  json,
  httpOptions,
}: PostRequestOptions) =>
  fetch(url, {
    timeout: timeout || 10000,
    method: 'POST',
    agent: httpOptions?.agent || getDefaultAgent,
    headers: buildHeaders(appName, instanceId, undefined, 'application/json', headers),
    body: JSON.stringify(json),
    strictSSL: httpOptions?.rejectUnauthorized,
  });

export const get = ({
  url,
  etag,
  appName,
  timeout,
  instanceId,
  headers,
  httpOptions,
  supportedSpecVersion,
}: GetRequestOptions) =>
  fetch(url, {
    method: 'GET',
    timeout: timeout || 10_000,
    agent: httpOptions?.agent || getDefaultAgent,
    headers: buildHeaders(appName, instanceId, etag, undefined, headers, supportedSpecVersion),
    retry: {
      retries: 2,
      maxTimeout: timeout || 10_000,
    },
    strictSSL: httpOptions?.rejectUnauthorized,
  });
