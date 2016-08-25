'use strict';
let Repository = require('./repository');
let request = require('request');

class PollingRepository extends Repository {
    constructor (options) {
        super(options);

        this.url = options.url;

        // Perform inital fetch
        this._fetch(options.url);

        // Setup fetch interval
        this.timer = setInterval(this._fetch.bind(this), options.refreshIntervall);
        this.timer.unref();
    }

    _fetch () {
        request({
            url: this.url,
            headers: { 'If-None-Match': this.etag },
        }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                try {
                    this._setToggles(JSON.parse(body).features);
                    this.etag = response.headers.etag;
                } catch (err) {
                    console.log(`Unleash failed parsing toggles: ${err}`);
                }
            }
        });
    }

    stop () {
        clearInterval(this.timer);
    }
}

module.exports = PollingRepository;
