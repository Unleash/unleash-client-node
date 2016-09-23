'use strict';
const Client = require('../../lib/client');
const DefaultStrategy = require('../../lib/default-strategy');
const Strategy = require('../../lib/strategy');
const assert = require('assert');

function buildToggle (name, active, strategies) {
    return {
        name,
        enabled: active,
        strategies: strategies || [{ name: 'default' }],
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

class CustomFalseStrategy extends Strategy {
    constructor () {
        super();
        this.name = 'custom-false';
    }

    isEnabled () {
        return false;
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
                return buildToggle('feature', true, [{ name: 'custom' }]);
            },
        };
        const client = new Client(repo, [new DefaultStrategy(), new CustomStrategy()]);
        const result = client.isEnabled('feature');

        assert.ok(result);
    });

    it('should use a set of custom strategies', () => {
        const repo = {
            getToggle () {
                return buildToggle('feature', true, [{ name: 'custom-false' }, { name: 'custom' }]);
            },
        };

        const client = new Client(repo, [new CustomFalseStrategy(), new CustomStrategy()]);
        const result = client.isEnabled('feature');

        assert.ok(result);
    });

    it('should use a set of custom strategies', () => {
        const repo = {
            getToggle () {
                return buildToggle('feature', true, [{ name: 'custom' }, { name: 'custom-false' }]);
            },
        };

        const client = new Client(repo, [new CustomFalseStrategy(), new CustomStrategy()]);
        const result = client.isEnabled('feature');

        assert.ok(result);
    });

    it('should return false a set of custom-false strategies', () => {
        const repo = {
            getToggle () {
                return buildToggle('feature', true, [{ name: 'custom-false' }, { name: 'custom-false' }]);
            },
        };

        const client = new Client(repo, [new CustomFalseStrategy(), new CustomStrategy()]);
        const result = !client.isEnabled('feature');

        assert.ok(result);
    });
});


