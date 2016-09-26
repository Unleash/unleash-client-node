'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var request = require('request');
var events_1 = require('events');
var data_formatter_1 = require('./data-formatter');
var storage_1 = require('./storage');
var Repository = (function (_super) {
    __extends(Repository, _super);
    function Repository(backupPath, url, refreshIntervall, StorageImpl) {
        var _this = this;
        if (StorageImpl === void 0) { StorageImpl = storage_1.Storage; }
        _super.call(this);
        if (!url.startsWith('http')) {
            throw new Error("Wrong url: " + url);
        }
        this.url = url;
        this.storage = new StorageImpl(backupPath);
        this.storage.on('error', function (err) { return _this.emit('error', err); });
        this.storage.on('ready', function () { return _this.emit('ready'); });
        process.nextTick(function () { return _this.fetch(); });
        if (refreshIntervall > 0) {
            this.timer = setInterval(function () { return _this.fetch(); }, refreshIntervall);
            this.timer.unref();
        }
    }
    Repository.prototype.validateFeature = function (feature) {
        var errors = [];
        if (!Array.isArray(feature.strategies)) {
            errors.push("feature.strategies should be an array, but was " + typeof feature.strategies);
        }
        if (typeof feature.enabled !== 'boolean') {
            errors.push("feature.enabled should be an boolean, but was " + typeof feature.enabled);
        }
        if (errors.length > 0) {
            var err = new Error(errors.join(', '));
            this.emit('error', err);
        }
    };
    Repository.prototype.fetch = function () {
        var _this = this;
        request({
            url: this.url,
            headers: { 'If-None-Match': this.etag }
        }, function (error, res, body) {
            if (error) {
                return _this.emit('error', error);
            }
            if (res.statusCode === 304) {
                // No new data
                return;
            }
            if (res.statusCode !== 200) {
                return _this.emit('error', new Error('Reponse was not statusCode 200'));
            }
            try {
                var payload = JSON.parse(body);
                var data = data_formatter_1.pickData(data_formatter_1.toNewFormat(payload));
                var obj = data.features.reduce(function (o, feature) {
                    _this.validateFeature(feature);
                    o[feature.name] = feature;
                    return o;
                }, {});
                _this.storage.reset(obj);
                _this.etag = res.headers.etag;
                _this.emit('data');
            }
            catch (err) {
                _this.emit('error', err);
            }
        });
    };
    Repository.prototype.stop = function () {
        clearInterval(this.timer);
    };
    Repository.prototype.getToggle = function (name) {
        return this.storage.get(name);
    };
    return Repository;
}(events_1.EventEmitter));
exports.__esModule = true;
exports["default"] = Repository;
//# sourceMappingURL=repository.js.map