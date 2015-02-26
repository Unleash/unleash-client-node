var DefaultStrategy = require('./default-strategy');

function isEnabled(name) {
  var toggle = this.repository.get(name);

  if(toggle && toggle.enabled) {
    var currentStrategy = this.strategies[toggle.strategy];
    return currentStrategy && currentStrategy.isEnabled();
  } else {
    return false;
  }
}

function Unleash(repository) {
  this.repository = repository;
  this.strategies = {
    "default": new DefaultStrategy()
  }
}

Unleash.prototype.isEnabled = isEnabled;

module.exports = Unleash;
