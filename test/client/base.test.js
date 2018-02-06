import test from 'ava';
import Client from '../../lib/client';

function buildToggle(name, active, strategies) {
    return {
        name,
        enabled: active,
        strategies: strategies || [{ name: 'default' }],
    };
}

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
