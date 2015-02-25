function isEnabled(name) {
  var toggle = this.repository.get(name);
  return toggle && toggle.enabled;
}

function Unleash(repository) {
  this.repository = repository;
}

Unleash.prototype.isEnabled = isEnabled;

module.exports = Unleash;
