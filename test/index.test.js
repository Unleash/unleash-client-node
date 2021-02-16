import test from 'ava';
import nock from 'nock';
import {
  initialize,
  isEnabled,
  Strategy,
  destroy,
  getFeatureToggleDefinition,
  getFeatureToggleDefinitions,
  count,
  countVariant,
  getVariant,
  startUnleash,
} from '../lib/index';

let counter = 1;
const getUrl = () => { const url = `http://test${counter}.app/`; counter += 1; return url; };
const metricsUrl = '/client/metrics';
const nockMetrics = (url, code = 200) => nock(url)
  .post(metricsUrl)
  .reply(code, '');
const registerUrl = '/client/register';
const nockRegister = (url, code = 200) => nock(url)
  .post(registerUrl)
  .reply(code, '');
const nockFeatures = (url, code = 200) => nock(url)
  .get('/client/features')
  .reply(code, { features: [] });
  

test('should load main module', (t) => {
  t.truthy(initialize);
  t.truthy(startUnleash);
  t.truthy(isEnabled);
  t.truthy(Strategy);
  t.truthy(destroy);
  t.truthy(countVariant);
  t.truthy(getVariant);
  t.truthy(getFeatureToggleDefinition);
  t.truthy(getFeatureToggleDefinitions);
  t.truthy(count);
});

test('initialize should init with valid options', (t) => {
  const url = getUrl();
  nockMetrics(url);
  nockRegister(url);
  t.notThrows(() => initialize({ appName: 'my-app-name', url }));
});

test('should call methods', (t) => {
  const url = getUrl();
  nockMetrics(url);
  nockRegister(url);
  t.notThrows(() => initialize({ appName: 'my-app-name', url }));
  t.snapshot(isEnabled('some-feature'));
  t.snapshot(getFeatureToggleDefinition('some-feature'));
  t.snapshot(getVariant('some-feature'));
  t.snapshot(count('some-feature', true));
  t.snapshot(countVariant('some-feature', 'variant1'));
});

test('should not return feature-toggle definition if there is no instance', t => {
  t.is(getFeatureToggleDefinition(), undefined);
});

test('should not empty array of feature-toggle definitions if there is no instance', t => {
  t.deepEqual(getFeatureToggleDefinitions(), []);
});

test('should start unleash with promise', async (t) => {
  const url = getUrl();
  nockFeatures(url);
  nockMetrics(url);
  nockRegister(url);
  const unleash = await startUnleash({ appName: 'my-app-name', url });
  t.truthy(unleash);
});
