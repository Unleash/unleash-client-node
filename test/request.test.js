import test from 'ava';

import { buildHeaders } from '../lib/request';

test('Custom headers should be included', (t) => {
  const headers = buildHeaders('https://bullshit.com', undefined, undefined, undefined, { hello: 'world' });
  t.is(headers.get('hello'), 'world');
});
