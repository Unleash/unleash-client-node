'use strict';
const Client = require('../../lib/client');
const DefaultStrategy = require('../../lib/default-strategy');
const Strategy = require('../../lib/strategy');
const assert = require('assert');
const util = require('util');

function buildToggle (name, active, strategy) {
    return {
        name,
        enabled: active,
        strategy: strategy || 'default',
    };
}

describe('Client implementation', function () {
    it('should use provided repository', function () {
        const repo = {
            getToggle () {
                return buildToggle('feature', true);
            },
        };
        const client = new Client(repo, [new DefaultStrategy()]);
        const result = client.isEnabled('feature');

        assert.ok(result);
    });

    it('should consider toggle not active', function () {
        const repo = {
            getToggle () {
                return buildToggle('feature', false);
            },
        };
        const client = new Client(repo, [new DefaultStrategy()]);
        const result = client.isEnabled('feature');

        assert.ok(!result);
    });

    it('should use custom strategy', function () {
        const repo = {
            getToggle () {
                return buildToggle('feature', true, 'custom');
            },
        };
        const client = new Client(repo, [new DefaultStrategy(), new CustomStrategy()]);
        const result = client.isEnabled('feature');

        assert.ok(result);
    });
});

function CustomStrategy () {
    this.name = 'custom';
}
util.inherits(CustomStrategy, Strategy);
CustomStrategy.prototype.isEnabled = function () {
    return true;
};
