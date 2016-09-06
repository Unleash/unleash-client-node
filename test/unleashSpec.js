'use strict';
const unleash = require('../lib/unleash');
const assert = require('assert');
const nock = require('nock');
const helper = require('./helper');

describe('The Unleash api', () => {
    beforeEach(() => {
        setupUnleashServerWithToggles([
            {
                name: 'feature',
                enabled: true,
                strategy: 'default',
            },
        ]);
    });

    afterEach(() => {
        nock.cleanAll();
        unleash.destroy();
        helper.removeBackup();
    });

    it('should allow request even before unleash is initialized', () => {
        assert.equal(unleash.isEnabled('unknown'), false);
    });

    it('should consider known feature-toggle as active', (done) => {
        unleash.initialize({
            url: 'http://unleash.app/features',
            backupPath: helper.backupPath,
        });

        const t = setInterval(() => {
            if (unleash.isEnabled('feature')) {
                assert.equal(unleash.isEnabled('feature'), true);
                clearInterval(t);
                unleash.destroy();
                done();
            }
        }, 10);
    });

    it('should consider unknown feature-toggle as disabled', (done) => {
        unleash.initialize({
            url: 'http://unleash.app/features',
            backupPath: helper.backupPath,
        });

        const t = setInterval(() => {
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
