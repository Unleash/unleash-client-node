'use strict';
let fs = require('fs');
let backupFileName = '/unleash-repo.json';

class Repository {
    constructor (options) {
        this._repository = {};
        this.backupFile = options.backupPath + backupFileName;
        this._loadBackup();
    }

    _setToggles (toggles) {
        let repo = {};

        toggles.forEach(toggle => {
            repo[toggle.name] = toggle;
        });

        this._repository = repo;
        this._saveBackup(repo);
    }

    _setRepository (repository) {
        this._repository = repository;
    }

    getRepository () {
        return this._repository;
    }

    getToggle (name) {
        return this._repository[name];
    }

    _saveBackup (repository) {
        fs.writeFile(this.backupFile, JSON.stringify(repository), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    _loadBackup () {
        fs.readFile(this.backupFile, (err, data) => {
            if (err) {
                if (err.errno !== 34) {
                    console.log('Error reading unleash bakcup file');
                }
            } else {
                try {
                    this._setRepository(JSON.parse(data));
                } catch (error) {
                    console.log('Error parsing the Unleash backup file', error);
                }
            }
        });
    }
}

module.exports = Repository;
