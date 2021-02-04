import { getAgent } from '../lib/request';
import test from 'ava';

import * as http from 'http';
import * as https from 'https';

test('http URLs should yield http.Agent', t => {
    const agent = getAgent(new URL('http://unleash-host1.com'));
    t.true(agent instanceof http.Agent);
});

test('https URLs should yield https.Agent', t => {
    const agent = getAgent(new URL('https://unleash.hosted.com'));
    t.true(agent instanceof https.Agent);
});
