'use strict';
// Constructor function
function Strategy (name) {
    this.name = name || 'unknown';
}

Strategy.prototype.getName = function () {
    return this.name;
};

Strategy.prototype.isEnabled = function () {
    return false;
};

module.exports = Strategy;
