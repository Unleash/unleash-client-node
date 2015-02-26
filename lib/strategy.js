//Constructor function
function Strategy() {
}

Strategy.prototype.getName = function() {
  return "unknown";
}

Strategy.prototype.isEnabled = function(parameters, context) {
  return false;
}

module.exports = Strategy;
