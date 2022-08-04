
import test from 'ava';
import definition from '@unleash/client-specification/specifications/01-simple-examples.json';
import { ToggleEngine } from './toggle-engine';

/* eslint-disable @typescript-eslint/no-unused-vars */
const { name, state, tests } = definition;

if (tests) {
    tests.forEach((testCase) => {
      test(`${name}:${testCase.description}`, (t) => new Promise((resolve, reject) => {
        const instance = new ToggleEngine(state);

        instance.on('error', reject);
        instance.on('synchronized', () => {
          const result = instance.isEnabled(testCase.toggleName, testCase.context);
          t.is(result, testCase.expectedResult);
          instance.destroy();
          resolve();
        });
      }));
    });
  }

// test('Should calculate a toggle state from bootstrap', (t) => {



//     t.true(engine.isEnabled('unknown') === false);
// })
