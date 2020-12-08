import test from 'ava';
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
} from '../lib/index';
const fetchMock = require('fetch-mock');

import 'isomorphic-fetch';

let counter = 1;
const getUrl = () => `http://test${counter++}.app`;
const nockMetrics = (url, code = 200) =>
    fetchMock.mock({
        url: `${url}/client/metrics`,
        response: {
            status: code,
        },
    });
const nockRegister = (url, code = 200) => {
    fetchMock.mock({
        url: `${url}/client/register`,
        response: {
            status: code,
        },
    });
    fetchMock.mock({
        url: `${url}/client/features`,
        response: {
            status: code,
            body: JSON.stringify({ features: [] }),
        },
    });
};

test('should load main module', t => {
    t.truthy(initialize);
    t.truthy(isEnabled);
    t.truthy(Strategy);
    t.truthy(destroy);
    t.truthy(countVariant);
    t.truthy(getVariant);
    t.truthy(getFeatureToggleDefinition);
    t.truthy(getFeatureToggleDefinitions);
    t.truthy(count);
});

test('initialize should init with valid options', t => {
    const url = getUrl();
    nockMetrics(url);
    nockRegister(url);
    t.notThrows(() => initialize({ appName: 'my-app-name', url }));
});

test('should call methods', t => {
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
