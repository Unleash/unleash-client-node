'use strict';
const Repository = require('../../lib/repository');
const assert = require('assert');
const fs = require('fs');

const backupPath = '/tmp/unleash-repo-test';
const backupFile = `${backupPath}/unleash-repo.json`;

if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath);
}

describe('Repository', () => {
    beforeEach(() => {
        saveBackup({
            featureZ: {
                name: 'featureZ',
                enabled: true,
                strategy: 'default',
            },
        });
    });

    afterEach(() => {
        if (fs.existsSync(backupFile)) {
            fs.unlinkSync(backupFile);
        }
    });

    it('should read backup from file at startup', (done) => {
        const repository = new Repository({ backupPath });

        const t = setInterval(() => {
            if (repository.getToggle('featureZ')) {
                clearInterval(t);
                assert.ok(repository.getRepository());
                assert.equal(repository.getToggle('featureZ').name, 'featureZ');
                done();
            }
        }, 10);
    });

    it('should not crash with foobar repo', () => {
        saveBackup({ foo: 'bar' });
        const repository = new Repository({ backupPath });
        assert.ok(!repository.getToggle('featureZ'));
    });
});


function saveBackup (repo) {
    fs.writeFileSync(backupFile, JSON.stringify(repo));
}
