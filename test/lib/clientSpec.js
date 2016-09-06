'use strict';
const Client = require('../../lib/client');
const DefaultStrategy = require('../../lib/default-strategy');
const Strategy = require('../../lib/strategy');
const assert = require('assert');

function buildToggle (name, active, strategy) {
    return {
        name,
        enabled: active,
        strategy: strategy || 'default',
    };
}

class CustomStrategy extends Strategy {
    constructor () {
        super();
        this.name = 'custom';
    }

    isEnabled () {
        return true;
    }
}

describe('Client implementation', () => {
    it('should use provided repository', () => {
        const repo = {
            getToggle () {
                return buildToggle('feature', true);
            },
        };
        const client = new Client(repo, [new DefaultStrategy()]);
        const result = client.isEnabled('feature');

        assert.ok(result);
    });

    it('should consider toggle not active', () => {
        const repo = {
            getToggle () {
                return buildToggle('feature', false);
            },
        };
        const client = new Client(repo, [new DefaultStrategy()]);
        const result = client.isEnabled('feature');

        assert.ok(!result);
    });

    it('should use custom strategy', () => {
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


