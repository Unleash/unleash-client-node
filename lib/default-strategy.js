var util = require("util");
var Strategy = require('./strategy');

function DefaultStrategy() {
}

util.inherits(DefaultStrategy, Strategy);

DefaultStrategy.prototype.getName = function() {
  return 'default';
}

DefaultStrategy.prototype.isEnabled = function() {
  return true;
}

module.exports = DefaultStrategy;
