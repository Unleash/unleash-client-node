'use strict';
const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs');

const REPO_VERSION = 'schema-v1';
const BACKUP_FILENAME = `/unleash-repo-${REPO_VERSION}.json`;

module.exports = class Storage extends EventEmitter {
    constructor ({ backupPath }) {
        super();
        this.backupPath = path.join(backupPath, BACKUP_FILENAME);
        // touched is a "ready"-flag to signal that backuploading should not set its result
        this._touched = false;
        this.data = {};
    }

    reset (data) {
        if (this._touched === false) {
            this.emit('ready');
        }
        this._touched = true;
        this.data = data;
    }

    get (key) {
        return this.data[key];
    }

    persist () {
        fs.writeFile(this.backupPath, JSON.stringify(this.data), (err) => {
            if (err) {
                this.emit('error', err);
            }
        });
    }

    load () {
        fs.readFile(this.backupPath, (err, data) => {
            if (this._touched) {
                return;
            }

            if (err) {
                if (err.errno !== 34) {
                    this.emit('error', err);
                }
                return;
            }

            try {
                this.reset(JSON.parse(data));
            } catch (err) {
                this.emit('error', err);
            }
        });
    }
}