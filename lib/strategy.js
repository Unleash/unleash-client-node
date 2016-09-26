'use strict';
var Strategy = (function () {
    function Strategy(name, returnValue) {
        if (returnValue === void 0) { returnValue = false; }
        this.name = name || 'unknown';
        this.returnValue = returnValue;
    }
    Strategy.prototype.isEnabled = function (parameters, context) {
        return this.returnValue;
    };
    return Strategy;
}());
exports.Strategy = Strategy;
//# sourceMappingURL=strategy.js.map