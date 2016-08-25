'use strict';
const nock = require('nock');
const assert = require('assert');
const PollingRepository = require('../../lib/polling-repository');
const helper = require('../helper');

describe('PollingRepository', function () {
    let repository;

    beforeEach(function () {
        repository = new PollingRepository({
            url: 'http://unleash.app/features',
            backupPath: helper.backupPath,
        });

        setupToggles([{ name: 'featureF', enabled: true, strategy: 'default' }]);
    });

    afterEach(function () {
        helper.removeBackup();
        repository.stop();
        nock.cleanAll();
    });

    it('should fetch toggles from server', function (done) {
        const t = setInterval(function () {
            if (repository.getToggle('featureF')) {
                assert.ok(repository.getToggle('featureF'));
                done();
                clearInterval(t);
            }
        }, 5);
    });
});

function setupToggles (toggles) {
    nock('http://unleash.app')
    .persist()
    .get('/features')
    .reply(200,  { features: toggles });
}
