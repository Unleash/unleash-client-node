var Repository = require('../../lib/repository');
var assert = require('assert');
var helper = require('../helper');

describe('Repository', function() {
    beforeEach(function() {
        helper.saveBackup({
            "featureZ" : {name: "featureZ",enabled: true,strategy: "default"}
        });

    });

    afterEach(function() {
        helper.removeBackup();
    });

    it('should read backup from file at startup', function(done) {
        var repository = new Repository({backupPath: helper.backupPath});

        var t = setInterval(function() {
            if(repository.getToggle("featureZ")) {
                clearInterval(t);
                assert.ok(repository.getRepository());
                assert.equal(repository.getToggle('featureZ').name, "featureZ");
                done();
            }
        }, 10);
    });

    it('should not crash with foobar repo', function() {
        helper.saveBackup({foo: "bar"});
        var repository = new Repository({backupPath: helper.backupPath});
        assert.ok(!repository.getToggle('featureZ'));
    });
});
