import test from 'ava';
import definition from '@unleash/client-specification/specifications/01-simple-examples.json';
import { ToggleEngine } from '../../lib/engine/toggle-engine';

const { name, state, tests } = definition;

if (tests) {
  tests.forEach((testCase) => {
    test(`${name}:${testCase.description}`, (t) =>
      new Promise((resolve) => {
        const instance = new ToggleEngine(state);

        const result = instance.isEnabled(testCase.toggleName, testCase.context);
        t.is(result, testCase.expectedResult);
        resolve();
      }));
  });
}
