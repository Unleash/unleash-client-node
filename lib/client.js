'use strict';
var UnleashClient = (function () {
    function UnleashClient(repository, strategies, errorHandler) {
        this.repository = repository;
        this.errorHandler = errorHandler || function () { };
        this.strategies = strategies || [];
        strategies.forEach(function (strategy) {
            if (!strategy ||
                !strategy.name ||
                typeof strategy.name !== 'string' ||
                !strategy.isEnabled ||
                typeof strategy.isEnabled !== 'function') {
                throw new Error('Invalid strategy data / interface');
            }
        });
    }
    UnleashClient.prototype.getStrategy = function (name) {
        var match;
        this.strategies.some(function (strategy) {
            if (strategy.name === name) {
                match = strategy;
                return true;
            }
            return false;
        });
        return match;
    };
    UnleashClient.prototype.isEnabled = function (name, context) {
        var _this = this;
        var feature = this.repository.getToggle(name);
        if (!feature || !feature.enabled) {
            return false;
        }
        if (!Array.isArray(feature.strategies)) {
            this.errorHandler(new Error("Malformed feature, strategies not an array, is a " + typeof feature.strategies));
            return false;
        }
        return feature.strategies.length > 0 && feature.strategies
            .some(function (strategySelector) {
            var strategy = _this.getStrategy(strategySelector.name);
            if (!strategy) {
                _this.errorHandler(new Error("Missing strategy " + strategySelector.name));
                return false;
            }
            return strategy.isEnabled(strategySelector.parameters, context);
        });
    };
    return UnleashClient;
}());
exports.__esModule = true;
exports["default"] = UnleashClient;
//# sourceMappingURL=client.js.map