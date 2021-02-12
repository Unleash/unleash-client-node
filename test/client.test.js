import test from 'ava';
import Client from '../lib/client';
import { Strategy } from '../lib/strategy';

import CustomStrategy from './true_custom_strategy';
import CustomFalseStrategy from './false_custom_strategy';

function buildToggle(name, active, strategies, variants = []) {
  return {
    name,
    enabled: active,
    strategies: strategies || [{ name: 'default' }],
    variants,
  };
}

const log = (err) => {
  console.error(err);
};

test('invalid strategy should throw', (t) => {
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

test('should use provided repository', (t) => {
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

test('should fallback when missing feature', (t) => {
  const repo = {
    getToggle() {
      return null;
    },
  };
  const client = new Client(repo, []);
  client.on('error', log).on('warn', log);

  const result = client.isEnabled('feature-x', {}, () => false);
  t.true(result === false);

  const result2 = client.isEnabled('feature-x', {}, () => true);
  t.true(result2 === true);
});

test('should consider toggle not active', (t) => {
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

test('should use custom strategy', (t) => {
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

test('should use a set of custom strategies', (t) => {
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

test('should return false a set of custom-false strategies', (t) => {
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

test('should emit error when invalid feature runtime', (t) => {
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
  client.on('error', (err) => {
    t.truthy(err);
    t.true(err.message.startsWith('Malformed feature'));
  });
  client.on('warn', log);

  t.true(client.isEnabled('feature-malformed-strategies') === false);
});

test('should emit error when mising feature runtime', (t) => {
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
  client.on('warn', (msg) => {
    t.truthy(msg);
    t.true(msg.startsWith('Missing strategy'));
  });

  t.true(client.isEnabled('feature-wrong-strategy') === false);
});

[
  [
    ['y', 1],
    ['0', 1],
    ['1', 1],
  ],
  [
    ['3', 33],
    ['2', 33],
    ['0', 33],
  ],
  [
    ['aaa', 100],
    ['3', 100],
    ['1', 100],
  ],
].forEach(([[id1, weight1], [id2, weight2], [id3, weight3]]) => {
  test(`should return variant when equal weight on ${weight1},${weight2},${weight3}`, (t) => {
    const repo = {
      getToggle() {
        return buildToggle('feature', true, null, [
          {
            name: 'variant1',
            weight: weight1,
            payload: {
              type: 'string',
              value: 'val1',
            },
          },
          {
            name: 'variant2',
            weight: weight2,
            payload: {
              type: 'string',
              value: 'val2',
            },
          },
          {
            name: 'variant3',
            weight: weight3,
            payload: {
              type: 'string',
              value: 'val3',
            },
          },
        ]);
      },
    };

    const strategies = [new Strategy('default', true)];
    const client = new Client(repo, strategies);
    client.on('error', log).on('warn', log);
    const result = client.isEnabled('feature');

    t.true(result === true);

    [id1, id2, id3].forEach((id) => {
      t.snapshot(client.getVariant('feature', { userId: id }));
    });
  });
});

test('should always return defaultVariant if missing variant', (t) => {
  const repo = {
    getToggle() {
      return buildToggle('feature-but-no-variant', true, []);
    },
  };

  const client = new Client(repo);

  client.on('error', log).on('warn', log);
  const result = client.getVariant('feature-but-no-variant', {});
  const defaultVariant = {
    enabled: false,
    name: 'disabled',
  };
  t.deepEqual(result, defaultVariant);

  const fallback = {
    enabled: false,
    name: 'customDisabled',
    payload: {
      type: 'string',
      value: '',
    },
  };
  const result2 = client.getVariant('feature-but-no-variant', {}, fallback);

  t.deepEqual(result2, fallback);

  const result3 = client.getVariant('missing-feature-x', {});
  t.deepEqual(result3, defaultVariant);
});
