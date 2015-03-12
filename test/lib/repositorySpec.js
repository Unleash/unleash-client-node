var Repository = require('../../lib/repository');
var assert = require('assert');
var fs = require('fs');

var backupPath = "/tmp/unleash-repo-test";
var backupFile = backupPath + '/unleash-repo.json';

if(!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath);
}

describe('Repository', function() {
    beforeEach(function() {
        saveBackup({
            "featureZ" : {name: "featureZ",enabled: true,strategy: "default"}
        });

    });

    afterEach(function() {
        if(fs.existsSync(backupFile)) {
            fs.unlinkSync(backupFile);
        }
    });

    it('should read backup from file at startup', function(done) {
        var repository = new Repository({backupPath: backupPath});

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
        saveBackup({foo: "bar"});
        var repository = new Repository({backupPath: backupPath});
        assert.ok(!repository.getToggle('featureZ'));
    });
});


function saveBackup(repo) {
    fs.writeFileSync(backupFile, JSON.stringify(repo));
}
