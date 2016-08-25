'use strict';
function isEnabled (name, context) {
    let toggle = this.repository.getToggle(name);

    if (toggle && toggle.enabled) {
        let currentStrategy = this.strategies[toggle.strategy];
        return currentStrategy && currentStrategy.isEnabled(toggle.parameters, context);
    } else {
        return false;
    }
}

function Unleash (repository, strategies) {
    this.repository = repository;
    this.strategies = {};
    let s = this.strategies;

    strategies.forEach(function (strategy) {
        s[strategy.name] = strategy;
    });
}

Unleash.prototype.isEnabled = isEnabled;

module.exports = Unleash;
