'use strict';
import test from 'ava';
import Client from '../lib/client';
import { Strategy } from '../lib/strategy';

function buildToggle (name, active, strategies) {
    return {
        name,
        enabled: active,
        strategies: strategies || [{ name: 'default' }],
    };
}

class CustomStrategy extends Strategy {
    constructor () {
        super('custom');
    }

    isEnabled () {
        return true;
    }
}

class CustomFalseStrategy extends Strategy {
    constructor () {
        super('custom-false');
    }

    isEnabled () {
        return false;
    }
}

const errorHandler = (err) => {
    console.error(err);
}

test('should use provided repository', (t) => {
    const repo = {
        getToggle () {
            return buildToggle('feature', true);
        },
    };
    const client = new Client(repo, [new Strategy('default', true)], errorHandler);
    const result = client.isEnabled('feature');

    t.true(result);
});

test('should consider toggle not active', (t) => {
    const repo = {
        getToggle () {
            return buildToggle('feature', false);
        },
    };
    const client = new Client(repo, [new Strategy('default', true)], errorHandler);
    const result = client.isEnabled('feature');

    t.true(!result);
});

test('should use custom strategy', (t) => {
    const repo = {
        getToggle () {
            return buildToggle('feature', true, [{ name: 'custom' }]);
        },
    };
    const client = new Client(repo, [new Strategy('default', true), new CustomStrategy()], errorHandler);
    const result = client.isEnabled('feature');

    t.true(result);
});

test('should use a set of custom strategies', (t) => {
    const repo = {
        getToggle () {
            return buildToggle('feature', true, [{ name: 'custom-false' }, { name: 'custom' }]);
        },
    };

    const strategies = [new CustomFalseStrategy(), new CustomStrategy()];
    const client = new Client(repo, strategies, errorHandler);
    const result = client.isEnabled('feature');

    t.true(result);
});

test('should use a set of custom strategies', (t) => {
    const repo = {
        getToggle () {
            return buildToggle('feature', true, [{ name: 'custom' }, { name: 'custom-false' }]);
        },
    };

    const strategies = [new CustomFalseStrategy(), new CustomStrategy()];
    const client = new Client(repo, strategies, errorHandler);
    const result = client.isEnabled('feature');

    t.true(result);
});

test('should return false a set of custom-false strategies', (t) => {
    const repo = {
        getToggle () {
            return buildToggle('feature', true, [{ name: 'custom-false' }, { name: 'custom-false' }]);
        },
    };

    const strategies = [new CustomFalseStrategy(), new CustomStrategy()];
    const client = new Client(repo, strategies, errorHandler);
    const result = !client.isEnabled('feature');

    t.true(result);
});


