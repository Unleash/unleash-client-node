var Client = require('../../lib/client');
var DefaultStrategy = require('../../lib/default-strategy');
var Strategy = require('../../lib/strategy');
var assert = require('assert');
var util = require("util");

function buildToggle(name, active, strategy) {
    return {
        name: name,
        enabled: active,
        strategy: strategy || "default"
    };
}

describe('Client implementation', function() {
    it('should use provided repository', function() {
        var repo = {
            getToggle: function() {
                return buildToggle("feature", true);
            }
        };
        var client = new Client(repo, [new DefaultStrategy()]);
        var result = client.isEnabled("feature");

        assert.ok(result);
    });

    it('should consider toggle not active', function() {
        var repo = {
            getToggle: function() {
                return buildToggle("feature", false);
            }
        };
        var client = new Client(repo, [new DefaultStrategy()]);
        var result = client.isEnabled("feature");

        assert.ok(!result);
    });

    it('should use custom strategy', function() {
        var repo = {
            getToggle: function() {
                return buildToggle("feature", true, "custom");
            }
        };
        var client = new Client(repo, [new DefaultStrategy(), new CustomStrategy()]);
        var result = client.isEnabled("feature");

        assert.ok(result);
    });
});

function CustomStrategy() {
    this.name = 'custom';
}
util.inherits(CustomStrategy, Strategy);
CustomStrategy.prototype.isEnabled = function() {
    return true;
};
