'use strict';
const Strategy = require('../../lib/strategy');
const assert = require('assert');

describe('Strategy', function () {
    it('should be disabled', function () {
        const strategy = new Strategy();
        assert.ok(!strategy.isEnabled());
    });

    it('should consider as unknown strategy', function () {
        const strategy = new Strategy();
        assert.equal(strategy.getName(), 'unknown');
    });
});
