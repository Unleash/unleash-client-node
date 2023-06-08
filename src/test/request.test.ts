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

test('Custom headers should be included', (t) => {
  const headers = buildHeaders('https://bullshit.com', undefined, undefined, undefined, {
    hello: 'world',
  });
  t.is(headers.hello, 'world');
});
