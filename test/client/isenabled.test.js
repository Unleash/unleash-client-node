import test from 'ava';
import Client from '../../lib/client';
import { Strategy } from '../../lib/strategy';

function buildToggle(name, active, strategies) {
    return {
        name,
        enabled: active,
        strategies: strategies || [{ name: 'default' }],
    };
}

class CustomStrategy extends Strategy {
    constructor() {
        super('custom');
    }

    isEnabled() {
        return true;
    }
}

class CustomFalseStrategy extends Strategy {
    constructor() {
        super('custom-false');
    }

    isEnabled() {
        return false;
    }
}

const log = err => {
    console.error(err);
};

test('should use provided repository', t => {
    const repo = {
        getToggle() {
            return buildToggle('feature', true);
        },
    };
    const client = new Client(repo, [new Strategy('default', true)]);
    client.on('error', log).on('warn', log);
    const result = client.isEnabled('feature');

    t.true(result);
});

test('should fallback when missing feature', t => {
    const repo = {
        getToggle() {
            return null;
        },
    };
    const client = new Client(repo, []);
    client.on('error', log).on('warn', log);

    const result = client.isEnabled('feature-x', {});
    t.true(result === false);

    const result2 = client.isEnabled('feature-x', {}, true);
    t.true(result2 === true);
});

test('should consider toggle not active', t => {
    const repo = {
        getToggle() {
            return buildToggle('feature', false);
        },
    };
    const client = new Client(repo, [new Strategy('default', true)]);
    client.on('error', log).on('warn', log);
    const result = client.isEnabled('feature');

    t.true(!result);
});

test('should use custom strategy', t => {
    const repo = {
        getToggle() {
            return buildToggle('feature', true, [{ name: 'custom' }]);
        },
    };
    const client = new Client(repo, [new Strategy('default', true), new CustomStrategy()]);
    client.on('error', log).on('warn', log);
    const result = client.isEnabled('feature');

    t.true(result);
});

test('should use a set of custom strategies', t => {
    const repo = {
        getToggle() {
            return buildToggle('feature', true, [{ name: 'custom-false' }, { name: 'custom' }]);
        },
    };

    const strategies = [new CustomFalseStrategy(), new CustomStrategy()];
    const client = new Client(repo, strategies);
    client.on('error', log).on('warn', log);
    const result = client.isEnabled('feature');

    t.true(result);
});

test('should use a set of custom strategies', t => {
    const repo = {
        getToggle() {
            return buildToggle('feature', true, [{ name: 'custom' }, { name: 'custom-false' }]);
        },
    };

    const strategies = [new CustomFalseStrategy(), new CustomStrategy()];
    const client = new Client(repo, strategies);
    client.on('error', log).on('warn', log);
    const result = client.isEnabled('feature');

    t.true(result);
});

test('should return false a set of custom-false strategies', t => {
    const repo = {
        getToggle() {
            return buildToggle('feature', true, [
                { name: 'custom-false' },
                { name: 'custom-false' },
            ]);
        },
    };

    const strategies = [new CustomFalseStrategy(), new CustomStrategy()];
    const client = new Client(repo, strategies);
    client.on('error', log).on('warn', log);
    const result = client.isEnabled('feature');

    t.true(result === false);
});

test('should emit error when invalid feature runtime', t => {
    t.plan(3);
    const repo = {
        getToggle() {
            return {
                name: 'feature-malformed-strategies',
                enabled: true,
                strategies: true,
            };
        },
    };

    const strategies = [];
    const client = new Client(repo, strategies);
    client.on('error', err => {
        t.truthy(err);
        t.true(err.message.startsWith('Malformed feature'));
    });
    client.on('warn', log);

    t.true(client.isEnabled('feature-malformed-strategies') === false);
});

test('should emit error when invalid feature runtime', t => {
    t.plan(3);
    const repo = {
        getToggle() {
            return {
                name: 'feature-wrong-strategy',
                enabled: true,
                strategies: [{ name: 'non-existent' }],
            };
        },
    };

    const strategies = [];
    const client = new Client(repo, strategies);
    client.on('error', log);
    client.on('warn', msg => {
        t.truthy(msg);
        t.true(msg.startsWith('Missing strategy'));
    });

    t.true(client.isEnabled('feature-wrong-strategy') === false);
});
