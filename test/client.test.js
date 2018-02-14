import test from 'ava';
import Client from '../lib/client';
import { Strategy } from '../lib/strategy';

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

test('invalid strategy should throw', t => {
    const repo = {
        getToggle() {
            return buildToggle('feature', true);
        },
    };

    t.throws(() => new Client(repo, [true, null]));
    t.throws(() => new Client(repo, [{}]));
    t.throws(() => new Client(repo, [{ name: 'invalid' }]));
    t.throws(() => new Client(repo, [{ isEnabled: 'invalid' }]));
    t.throws(() => new Client(repo, [{ name: 'valid', isEnabled: () => {} }, null]));
});

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

function testGroup(group) {
    const repo = {
        getToggle() {
            return buildToggle('feature', true, [
                {
                    name: 'unleash-internal-group-strategy',
                    group,
                },
            ]);
        },
    };
    const strategies = [new CustomFalseStrategy(), new CustomStrategy()];
    const client = new Client(repo, strategies);
    client.on('error', log).on('warn', log);
    return client.isEnabled('feature');
}

test('should return the group value for sub lists when all is true', t => {
    const result = testGroup([{ name: 'custom', operator: 'AND' }, { name: 'custom' }]);

    t.true(result === true);

    const result2 = testGroup([
        { name: 'custom', operator: 'AND' },
        { name: 'custom', operator: 'AND' },
        { name: 'custom', operator: 'AND' },
        { name: 'custom' },
    ]);

    t.true(result2 === true);

    const result3 = testGroup([{ name: 'custom' }]);

    t.true(result3 === true);
});

test('group value is false and has 2 entries and OR default operator', t => {
    const result = testGroup([{ name: 'custom-false' }, { name: 'custom-false' }]);

    t.true(result === false);

    const result2 = testGroup([
        { name: 'custom' },
        { name: 'custom-false' },
        { name: 'custom-false' },
    ]);

    t.true(result2 === true);

    const result3 = testGroup([
        { name: 'custom-false' },
        { name: 'custom' },
        { name: 'custom-false' },
    ]);

    t.true(result3 === true);
});

test('group value is false and has 2 entries', t => {
    const result = testGroup([{ name: 'custom', operator: 'AND' }, { name: 'custom-false' }]);

    t.true(result === false);

    const result2 = testGroup([{ name: 'custom-false', operator: 'AND' }, { name: 'custom' }]);

    t.true(result2 === false);
});

test('groups value with one false value and multiple entries', t => {
    const result = testGroup([
        { name: 'custom', operator: 'AND' },
        { name: 'custom', operator: 'AND' },
        { name: 'custom', operator: 'AND' },
        { name: 'custom-false' },
    ]);

    t.true(result === false);

    const result2 = testGroup([
        { name: 'custom', operator: 'AND' },
        { name: 'custom', operator: 'AND' },
        { name: 'custom-false', operator: 'AND' },
        { name: 'custom' },
    ]);

    t.true(result2 === false);

    const result3 = testGroup([
        { name: 'custom', operator: 'AND' },
        { name: 'custom', operator: 'AND' },
        { name: 'custom', operator: 'AND' },
        { name: 'custom-false', operator: 'AND' },
        { name: 'custom', operator: 'AND' },
        { name: 'custom' },
    ]);

    t.true(result3 === false);
});

test('groups with inner AND group that resovles to true', t => {
    const result = testGroup([
        {
            name: 'inner-group',
            group: [{ name: 'custom', operator: 'AND' }, { name: 'custom' }],
            operator: 'AND',
        },
        { name: 'custom', operator: 'AND' },
        { name: 'custom' },
    ]);

    t.true(result === true);
});

test('groups with inner AND group that resovles to false', t => {
    const result = testGroup([
        {
            name: 'inner-group',
            group: [{ name: 'custom', operator: 'AND' }, { name: 'custom-false' }],
            operator: 'AND',
        },
        { name: 'custom', operator: 'AND' },
        { name: 'custom' },
    ]);

    t.true(result === false);
});

test('groups with inner OR group that resovles to true', t => {
    const result = testGroup([
        {
            name: 'inner-group',
            group: [{ name: 'custom-false' }, { name: 'custom' }],
            operator: 'AND',
        },
        { name: 'custom', operator: 'AND' },
        { name: 'custom' },
    ]);

    t.true(result === true);

    const result2 = testGroup([
        { name: 'custom', operator: 'AND' },
        {
            name: 'inner-group',
            group: [{ name: 'custom-false' }, { name: 'custom' }, { name: 'custom-false' }],
            operator: 'AND',
        },
        { name: 'custom' },
    ]);

    t.true(result2 === true);

    const result3 = testGroup([
        {
            name: 'inner-group',
            group: [{ name: 'custom-false' }, { name: 'custom' }, { name: 'custom-false' }],
        },
    ]);

    t.true(result3 === true);
});

test('groups with inner OR group that resolves to false', t => {
    const result = testGroup([
        {
            name: 'inner-group',
            group: [{ name: 'custom-false', operator: 'OR' }, { name: 'custom-false' }],
            operator: 'AND',
        },
        { name: 'custom', operator: 'AND' },
        { name: 'custom' },
    ]);

    t.true(result === false);
});

test('groups with inner AND group that resolves to false', t => {
    const result = testGroup([
        {
            name: 'inner-group',
            group: [
                {
                    group: [{ name: 'custom', operator: 'AND' }, { name: 'custom' }],
                    operator: 'AND',
                },
                { name: 'custom-false', operator: 'AND' },
                { name: 'custom-false' },
            ],
            operator: 'AND',
        },
        { name: 'custom', operator: 'AND' },
        { name: 'custom' },
    ]);

    t.true(result === false);
});

test('groups with inner inner AND group', t => {
    const result = testGroup([
        {
            name: 'inner-group',
            group: [
                {
                    name: 'inner-inner-group',
                    group: [{ name: 'custom', operator: 'AND' }, { name: 'custom' }],
                    operator: 'AND',
                },
                { name: 'custom', operator: 'AND' },
                { name: 'custom' },
            ],
            operator: 'AND',
        },
        { name: 'custom', operator: 'AND' },
        { name: 'custom' },
        { name: 'custom-false' },
    ]);

    t.true(result === true);

    const result2 = testGroup([
        { name: 'custom-false' },
        {
            name: 'inner-group',
            group: [
                { name: 'custom', operator: 'AND' },
                {
                    name: 'inner-inner-group',
                    group: [{ name: 'custom', operator: 'AND' }, { name: 'custom' }],
                    operator: 'AND',
                },
                { name: 'custom' },
            ],
            operator: 'AND',
        },
        { name: 'custom', operator: 'AND' },
        { name: 'custom' },
    ]);

    t.true(result2 === true);
});
