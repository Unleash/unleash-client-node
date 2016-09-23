'use strict';
const Strategy = require('../../lib/strategy');
const assert = require('assert');

describe('Strategy', () => {
    it('should be disabled', () => {
        const strategy = new Strategy();
        assert.ok(!strategy.isEnabled());
    });

    it('should consider as unknown strategy', () => {
        const strategy = new Strategy();
        assert.equal(strategy.name, 'unknown');
    });
});
