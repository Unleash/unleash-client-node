'use strict';
const unleash = require('../unleash');
const assert = require('assert');
const nock = require('nock');
const helper = require('./helper');

describe('The Unleash api', function () {
    beforeEach(function () {
        setupUnleashServerWithToggles([
            { name: 'feature', enabled: true, strategy: 'default' },
        ]);
    });

    afterEach(function () {
        nock.cleanAll();
        unleash.destroy();
        helper.removeBackup();
    });

    it('should allow request even before unleash is initialized', function () {
        assert.equal(unleash.isEnabled('unknown'), false);
    });

    it('should consider known feature-toggle as active', function (done) {
        unleash.initialize({
            url: 'http://unleash.app/features',
            backupPath: helper.backupPath,
        });

        const t = setInterval(function () {
            if (unleash.isEnabled('feature')) {
                assert.equal(unleash.isEnabled('feature'), true);
                clearInterval(t);
                unleash.destroy();
                done();
            }
        }, 10);
    });

    it('should consider unknown feature-toggle as disabled', function (done) {
        unleash.initialize({
            url: 'http://unleash.app/features',
            backupPath: helper.backupPath,
        });

        const t = setInterval(function () {
            // Wait for known active feature-toggle
            if (unleash.isEnabled('feature')) {
                assert.equal(unleash.isEnabled('unknown'), false);

                clearInterval(t);
                unleash.destroy();
                done();
            }
        }, 10);
    });
});

function setupUnleashServerWithToggles (toggles) {
    nock('http://unleash.app')
    .persist()
    .get('/features')
    .reply(200,  { features: toggles });
}
