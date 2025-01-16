import test from 'ava';

import * as http from 'http';
import * as https from 'https';
import { getDefaultAgent, buildHeaders } from '../request';

test('http URLs should yield http.Agent', (t) => {
  const agent = getDefaultAgent(new URL('http://unleash-host1.com'));
  t.true(agent instanceof http.Agent);
});

test('https URLs should yield https.Agent', (t) => {
  const agent = getDefaultAgent(new URL('https://unleash.hosted.com'));
  t.true(agent instanceof https.Agent);
});

test('Correct headers should be included', (t) => {
  const headers = buildHeaders({
    appName: 'myApp',
    instanceId: 'instanceId',
    etag: undefined,
    contentType: undefined,
    connectionId: 'connectionId',
    custom: {
      hello: 'world',
    },
  });
  t.is(headers.hello, 'world');
  t.is(headers['UNLEASH-INSTANCEID'], 'instanceId');
  t.is(headers['x-unleash-connection-id'], 'connectionId');
  t.is(headers['x-unleash-appname'], 'myApp');
  t.regex(headers['x-unleash-sdk'], /^unleash-node@\d+\.\d+\.\d+/);
});
