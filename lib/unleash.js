'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var client_1 = require('./client');
var repository_1 = require('./repository');
var strategy_1 = require('./strategy');
var strategy_2 = require('./strategy');
exports.Strategy = strategy_2.Strategy;
var os_1 = require('os');
var events_1 = require('events');
var BACKUP_PATH = os_1.tmpdir();
var Unleash = (function (_super) {
    __extends(Unleash, _super);
    function Unleash(_a) {
        var _this = this;
        var url = _a.url, _b = _a.refreshIntervall, refreshIntervall = _b === void 0 ? 15 * 1000 : _b, _c = _a.backupPath, backupPath = _c === void 0 ? BACKUP_PATH : _c, _d = _a.strategies, strategies = _d === void 0 ? [] : _d, _e = _a.errorHandler, errorHandler = _e === void 0 ? function () { } : _e;
        _super.call(this);
        if (!url) {
            throw new Error('Unleash server URL missing');
        }
        this.repository = new repository_1["default"](backupPath, url, refreshIntervall);
        this.repository.on('error', function (err) {
            _this.emit('error', err);
        });
        strategies = [new strategy_1.Strategy('default', true)].concat(strategies);
        this.repository.on('ready', function () {
            _this.client = new client_1["default"](_this.repository, strategies, errorHandler);
            _this.emit('ready');
        });
    }
    Unleash.prototype.destroy = function () {
        if (this.repository) {
            this.repository.stop();
        }
        this.client = undefined;
    };
    Unleash.prototype.isEnabled = function (name, context) {
        if (this.client) {
            return this.client.isEnabled(name, context);
        }
        else {
            this.emit('warning', Date.now() + " WARN: Unleash has not been initalized yet. isEnabled(" + name + ") defaulted to false");
            return false;
        }
    };
    return Unleash;
}(events_1.EventEmitter));
exports.Unleash = Unleash;
//# sourceMappingURL=unleash.js.map