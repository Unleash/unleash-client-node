var unleash = require('../unleash');
var assert = require('assert');
var nock = require('nock');
var helper = require('./helper');

describe('The Unleash api', function () {
    beforeEach(function() {
        setupUnleashServerWithToggles([
            {name: "feature",enabled: true,strategy: "default"}
        ]);
    });

    afterEach(function() {
        helper.removeBackup();
        unleash.destroy();
        nock.cleanAll();
    });

    it('should allow request even before unleash is initialized', function() {
        assert.equal(unleash.isEnabled("unknown"), false);
    });

    it('should consider known feature-toggle as active', function(done) {
        unleash.initialize({
            url: 'http://unleash.app/features',
            backupPath: helper.backupPath
        });

        var t = setInterval(function() {
            if(unleash.isEnabled('feature')) {
                clearInterval(t);
                assert.equal(unleash.isEnabled('feature'), true);
                done();
            }
        }, 10);
    });

    it('should consider unknown feature-toggle as disabled', function(done) {
        unleash.initialize({
            url: 'http://unleash.app/features',
            backupPath: helper.backupPath
        });

        var t = setInterval(function() {
            //Wait for known active feature-toggle
            if(unleash.isEnabled('feature')) {
                clearInterval(t);
                assert.equal(unleash.isEnabled('unknown'), false);
                done();
            }
        }, 10);
    });
});

function setupUnleashServerWithToggles(toggles) {
    nock('http://unleash.app')
    .persist()
    .get('/features')
    .reply(200,  {features: toggles});
}
