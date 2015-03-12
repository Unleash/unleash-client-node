var fs = require('fs');
var nock = require('nock');
var assert = require('assert');
var PollingRepository = require('../../lib/polling-repository');
var helper = require('../helper');

describe('PollingRepository', function() {
    var repository;

    beforeEach(function() {
        repository = new PollingRepository({
            url: "http://unleash.app/features",
            backupPath: helper.backupPath
        });

        setupToggles([{name: "featureF",enabled: true,strategy: "default"}]);
    });

    afterEach(function() {
        helper.removeBackup();
        repository.stop();
        nock.cleanAll();
    });

    it('should fetch toggles from server', function(done) {
        var t = setInterval(function() {
            if(repository.getToggle('featureF')) {
                assert.ok(repository.getToggle('featureF'));
                done();
                clearInterval(t);
            }
        }, 5);
    });
});

function setupToggles(toggles) {
    nock('http://unleash.app')
    .persist()
    .get('/features')
    .reply(200,  {features: toggles});
}
