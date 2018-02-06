import test from 'ava';

import { pickData, toNewFormat } from '../lib/data-formatter';

const oldFormat = require('./fixtures/format-0.json');
const newFormat = require('./fixtures/format-1.json');

test('toNewFormat should format old format to new format', t => {
    const result = toNewFormat(oldFormat);
    t.true(
        result.features.some(
            feature => Array.isArray(feature.strategies) && feature.strategies.length > 0
        )
    );
});

test('toNewFormat should format new format', t => {
    const result = toNewFormat(newFormat);
    t.true(
        result.features.some(
            feature => Array.isArray(feature.strategies) && feature.strategies.length > 0
        )
    );
});

test('pickData should pick wanted fields', t => {
    const result = pickData(toNewFormat(newFormat));
    t.true(
        result.features.some(
            feature =>
                Array.isArray(feature.strategies) &&
                feature.strategies.length > 0 &&
                feature.variants.length > 0 &&
                feature.name &&
                typeof feature.enabled === 'boolean'
        )
    );
});
