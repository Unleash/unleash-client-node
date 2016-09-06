'use strict';
const fs = require('fs');
const { EventEmitter } = require('events');
const BACKUP_FILENAME = '/unleash-repo.json';

class Repository extends EventEmitter {
    constructor (options) {
        super();
        this._repository = {};
        this.backupFile = options.backupPath + BACKUP_FILENAME;
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
            console.log('file saved', err);
        });
    }

    _loadBackup () {
        console.log('load backup');
        fs.readFile(this.backupFile, (err, data) => {
            if (err) {
                if (err.errno !== 34) {
                    console.log(err.errno, err, err.stack);
                    console.log(`Error reading unleash backcup file (${this.backupFile}`);
                }
            } else {
                try {
                    this._setRepository(JSON.parse(data));
                    this.emit('ready');
                } catch (error) {
                    console.log('Error parsing the Unleash backup file', error);
                }
            }
        });
    }
}

module.exports = Repository;
