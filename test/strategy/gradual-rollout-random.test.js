import test from 'ava';

import { GradualRolloutRandomStrategy } from '../../lib/strategy/gradual-rollout-random';

test('gradual-rollout-random strategy should have correct name', t => {
    const strategy = new GradualRolloutRandomStrategy();
    t.deepEqual(strategy.name, 'gradualRolloutRandom');
});

test('should only at most miss by one percent', t => {
    const strategy = new GradualRolloutRandomStrategy();

    const percentage = 25;
    const groupId = 'groupId';

    const rounds = 200000;
    let enabledCount = 0;

    for (let i = 0; i < rounds; i++) {
        let params = { percentage, groupId };
        let context = { sessionId: i };
        if (strategy.isEnabled(params, context)) {
            enabledCount++;
        }
    }
    const actualPercentage = Math.round(enabledCount / rounds * 100);
    const highMark = percentage + 1;
    const lowMark = percentage - 1;

    t.true(lowMark <= actualPercentage);
    t.true(highMark >= actualPercentage);
});

test('gradual-rollout-random strategy should be disabled when percentage=0', t => {
    const strategy = new GradualRolloutRandomStrategy();
    let params = { percentage: '0', groupId: 'test' };
    t.false(strategy.isEnabled(params));
});
