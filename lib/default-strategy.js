var util = require("util");
var Strategy = require('./strategy');

function DefaultStrategy() {
    this.name = "default";
}

util.inherits(DefaultStrategy, Strategy);

DefaultStrategy.prototype.isEnabled = function() {
    return true;
};

module.exports = DefaultStrategy;
