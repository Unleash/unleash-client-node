var Repository = require('./repository');
var util = require("util");
var request = require('request');

function PollingRepository(options) {
    Repository.call(this, options);

    this.url = options.url;


    //Perform inital fetch
    this._fetch(options.url);

    //Setup fetch interval
    this.timer = setInterval(this._fetch.bind(this),options.refreshIntervall);
    this.timer.unref();
}

util.inherits(PollingRepository, Repository);

PollingRepository.prototype._fetch = function() {
    request({
        url: this.url,
        headers: {'If-None-Match': this.etag}
    },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                this._setToggles(JSON.parse(body).features);
                this.etag = response.headers.etag;
            } catch(err) {
                console.log("Unleash failed parsing toggles: " + err);
            }
        }
    }.bind(this)
);
};

PollingRepository.prototype.stop = function() {
    clearInterval(this.timer);
};

module.exports = PollingRepository;
