'use strict';
const unleash = require('../lib/unleash');
const assert = require('assert');
const nock = require('nock');
const helper = require('./helper');


function setupUnleashServerWithToggles (toggles) {
    nock('http://unleash.app')
        .persist()
        .get('/features')
        .reply(200,  { features: toggles });
}


function timeCheck (fn, checkTime, timeoutTime) {
    let timer2;

    const timer = setInterval(() => {
        if (fn()) {
            clearTimeout(timer);
            clearTimeout(timer2);
        }
    }, checkTime);
    timer2 = setTimeout(() => {
        clearTimeout(timer);
        throw new Error('Test timed out');
    }, timeoutTime);
}


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
        helper.removeBackup();
    });

    it('should allow request even before unleash is initialized', () => {
        const instance = unleash.initialize({
            url: 'http://unleash.app',
            errorHandler (e) {
                throw e;
            },
        });
        assert.equal(instance.isEnabled('unknown'), false);
        instance.destroy();
    });

    it('should consider known feature-toggle as active', (done) => {
        const instance = unleash.initialize({
            url: 'http://unleash.app/features',
            backupPath: helper.backupPath,
            errorHandler (e) {
                throw e;
            },
        });

        timeCheck(() => {
            if (instance.isEnabled('feature')) {
                assert.equal(instance.isEnabled('feature'), true);
                instance.destroy();
                done();
                return true;
            }
            return false;
        }, 10, 1000);
    });

    it('should consider unknown feature-toggle as disabled', (done) => {
        const instance = unleash.initialize({
            url: 'http://unleash.app/features',
            backupPath: helper.backupPath,
            errorHandler (e) {
                throw e;
            },
        });

        timeCheck(() => {
            // Wait for known active feature-toggle
            if (instance.isEnabled('feature')) {
                assert.equal(instance.isEnabled('unknown'), false);
                instance.destroy();
                done();
                return true;
            }
            return false;
        }, 10, 1000);
    });
});
