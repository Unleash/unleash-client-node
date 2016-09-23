'use strict';
const { EventEmitter } = require('events');
const request = require('request');
const { toNewFormat, pickData } = require('./data-formatter.js');
const Storage = require('./storage');


class Repository extends EventEmitter {
    constructor ({ backupPath, url, refreshIntervall } = {}) {
        super();

        this.storage = new Storage({
            backupPath,
        });
        this.storage.on('error', (err) => this.emit('error', err));
        this.storage.on('ready', () => this.emit('ready'));

        if (url) {
            this.url = url;
            this.fetch();
        }

        if (refreshIntervall) {
            // Setup fetch interval
            this.timer = setInterval(() => this.fetch(), refreshIntervall);
            this.timer.unref();
        }
    }

    fetch () {
        request({
            url: this.url,
            headers: { 'If-None-Match': this.etag },
        }, (error, res, body) => {
            if (error) {
                return this.emit('error', error);
            }

            if (res.statusCode === 304) {
                // No new data
                return;
            }

            if (res.statusCode !== 200) {
                return this.emit('error', new Error('Reponse was not statusCode 200'));
            }

            try {
                const payload = JSON.parse(body);
                const data = pickData(toNewFormat(payload));
                const obj = data.features.reduce((o, feature) => {
                    o[feature.name] = feature;
                    return o;
                }, {});
                this.storage.reset(obj);
                this.etag = res.headers.etag;
            } catch (err) {
                this.emit('error', err);
            }
        });
    }

    stop () {
        clearInterval(this.timer);
    }

    getToggle (name) {
        return this.storage.get(name);
    }
}

module.exports = Repository;
