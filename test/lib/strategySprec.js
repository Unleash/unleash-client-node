var Strategy = require('../../lib/strategy');
var assert = require('assert');

describe('Strategy', function() {
    it('should be disabled', function() {
        var strategy = new Strategy();
        assert.ok(!strategy.isEnabled());
    });

    it('should consider as unknown strategy', function() {
        var strategy = new Strategy();
        assert.equal(strategy.getName(), 'unknown');
    });
});
