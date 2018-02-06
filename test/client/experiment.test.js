import test from 'ava';
import Client from '../../lib/client';
import { Strategy, Experiment } from '../../lib/strategy';
import { Variant } from '../../lib/variant';

function buildToggle(name, active, strategies, variants) {
    return {
        name,
        enabled: active,
        strategies: strategies || [{ name: 'default' }, { name: 'control' }],
        variants: variants || [{ name: 'control' }],
    };
}

class ControlExperiment extends Experiment {
    constructor() {
        super('control');
    }

    experiment() {
        return new Variant('control');
    }
}

class CustomExperiment extends Experiment {
    constructor() {
        super('custom');
    }

    experiment() {
        return new Variant('custom');
    }
}

class CustomNullExperiment extends Experiment {
    constructor() {
        super('custom-null');
    }

    experiment() {
        return null;
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
    const client = new Client(repo, [new Strategy('default', true), new ControlExperiment()]);
    client.on('error', log).on('warn', log);
    const result = client.experiment('feature');

    t.deepEqual(result, new Variant('control'));
});

test('should fallback when missing feature', t => {
    const repo = {
        getToggle() {
            return null;
        },
    };
    const client = new Client(repo, []);
    client.on('error', log).on('warn', log);

    const result = client.experiment('feature-x', {});
    t.true(result === null);

    const fallback = new Variant('fallback');
    const result2 = client.experiment('feature-x', {}, fallback);
    t.deepEqual(result2, fallback);
});

test('should consider toggle not active', t => {
    const repo = {
        getToggle() {
            return buildToggle('feature', false);
        },
    };
    const client = new Client(repo, [new Strategy('default', true), new ControlExperiment()]);
    client.on('error', log).on('warn', log);
    const result = client.experiment('feature');

    t.true(result === null);
});

test('should use custom experiment', t => {
    const repo = {
        getToggle() {
            return buildToggle('feature', true, [{ name: 'custom' }, { name: 'control' }]);
        },
    };
    const client = new Client(repo, [new CustomExperiment(), new ControlExperiment()]);
    client.on('error', log).on('warn', log);
    const result = client.experiment('feature');

    t.deepEqual(result, new Variant('custom'));
});

test('should use a set of custom strategies', t => {
    const repo = {
        getToggle() {
            return buildToggle('feature', true, [{ name: 'custom-null' }, { name: 'custom' }]);
        },
    };

    const strategies = [new CustomNullExperiment(), new CustomExperiment()];
    const client = new Client(repo, strategies);
    client.on('error', log).on('warn', log);
    const result = client.experiment('feature');

    t.deepEqual(result, new Variant('custom'));
});

test('should use a set of custom strategies', t => {
    const repo = {
        getToggle() {
            return buildToggle('feature', true, [{ name: 'custom' }, { name: 'custom-null' }]);
        },
    };

    const strategies = [new CustomNullExperiment(), new CustomExperiment()];
    const client = new Client(repo, strategies);
    client.on('error', log).on('warn', log);
    const result = client.experiment('feature');

    t.deepEqual(result, new Variant('custom'));
});

test('should return null a set of custom-null strategies', t => {
    const repo = {
        getToggle() {
            return buildToggle('feature', true, [{ name: 'custom-null' }, { name: 'custom-null' }]);
        },
    };

    const strategies = [new CustomNullExperiment(), new CustomExperiment()];
    const client = new Client(repo, strategies);
    client.on('error', log).on('warn', log);
    const result = client.experiment('feature');

    t.true(result === null);
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

    const client = new Client(repo, [new CustomExperiment()]);
    client.on('error', err => {
        t.truthy(err);
        t.true(err.message.startsWith('Malformed feature'));
    });
    client.on('warn', log);

    t.true(client.experiment('feature-malformed-strategies') === null);
});

test('should emit error when invalid feature runtime2', t => {
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

    const client = new Client(repo, [new CustomExperiment()]);
    client.on('error', log);
    client.on('warn', msg => {
        t.truthy(msg);
        t.true(msg.startsWith('Missing strategy'));
    });

    t.true(client.experiment('feature-wrong-strategy') === null);
});
