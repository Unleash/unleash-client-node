import test from 'ava';

import { Unleash } from '../lib/unleash';

async function fn() {
    return Promise.resolve('foo');
}

test(async (t) => {
    t.is(await fn(), 'foo');
});

test.todo('core tests');