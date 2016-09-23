'use strict';
const Repository = require('../../lib/repository');
const assert = require('assert');
const fs = require('fs');
const nock = require('nock');
const helper = require('../helper');

const backupPath = '/tmp/unleash-repo-test';
const backupFile = `${backupPath}/unleash-repo.json`;

if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath);
}

describe('PollingRepository', () => {
    let repository;

    function setupToggles (toggles) {
        nock('http://unleash.app')
        .persist()
        .get('/features')
        .reply(200,  { features: toggles });
    }

    beforeEach(() => {
        repository = new Repository({
            url: 'http://unleash.app/features',
            backupPath: helper.backupPath,
            refreshInterval: 100,
            errorHandler (err) {
                throw err;
            },
        });

        setupToggles([{
            name: 'featureF',
            enabled: true,
            strategy: 'default',
        }]);
    });

    afterEach(() => {
        helper.removeBackup();
        repository.stop();
        nock.cleanAll();
    });

    it('should fetch toggles from server', (done) => {
        const t = setInterval(() => {
            if (repository.getToggle('featureF')) {
                assert.ok(repository.getToggle('featureF'));
                done();
                clearInterval(t);
            }
        }, 5);
    });
});



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
        const repository = new Repository({
            backupPath,
            errorHandler (err) {
                throw err;
            },
        });

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
