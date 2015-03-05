function isEnabled(name, context) {
    var toggle = this.repository.getToggle(name);

    if(toggle && toggle.enabled) {
        var currentStrategy = this.strategies[toggle.strategy];
        return currentStrategy && currentStrategy.isEnabled(toggle.parameters, context);
    } else {
        return false;
    }
}

function Unleash(repository, strategies) {
    this.repository = repository;
    this.strategies = {};
    var s = this.strategies;

    strategies.forEach(function(strategy) {
        s[strategy.name] = strategy;
    });
}

Unleash.prototype.isEnabled = isEnabled;

module.exports = Unleash;
