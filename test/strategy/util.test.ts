import test from 'ava';

import normalizedValue from '../../lib/strategy/util';

test('normalized values are the same across node, java, and go clients', (t) => {
  t.is(normalizedValue('123', 'gr1'), 73);
  t.is(normalizedValue('999', 'groupX'), 25);
});
