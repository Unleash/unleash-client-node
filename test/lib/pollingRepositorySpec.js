var fs = require('fs');
var nock = require('nock');
var assert = require('assert');
var PollingRepository = require('../../lib/polling-repository');

var backupPath = "/tmp/unleash-test";

describe('Repository', function() {
    var repository;

    beforeEach(function() {
        if(!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath);
        }

        repository = new PollingRepository({
            url: "http://unleash.app/features",
            backupPath: backupPath
        });

        setupToggles([{name: "feature",enabled: true,strategy: "default"}]);
    });

    afterEach(function() {
        repository.stop();
        nock.cleanAll();
    });

    it('should fetch toggles from server', function(done) {
        var t = setInterval(function() {
            if(repository.getToggle('feature')) {
                assert.ok(repository.getToggle('feature'));
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
