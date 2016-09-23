'use strict';

const assert = require('assert');

const { pickData, toNewFormat } = require('../../lib/data-formatter');

const oldFormat = require('./fixtures/format-0.json');
const newFormat = require('./fixtures/format-1.json');

describe('toNewFormat', () => {
    it('should format old format to new format', () => {
        const result = toNewFormat(oldFormat);
        assert.ok(
            result.features.some(
                (feature) => Array.isArray(feature.strategies) && feature.strategies.length > 0
            )
        );
    });

    it('should format new format', () => {

    });
});

describe('pickData', () => {
    it('should pick wanted fields', () => {

    });
});

