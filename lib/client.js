'use strict';

class Unleash {
    constructor (repository, strategies) {
        this.repository = repository;
        this.strategies = {};

        strategies.forEach(strategy => {
            this.strategies[strategy.name] = strategy;
        });
    }

    isEnabled (name, context) {
        const toggle = this.repository.getToggle(name);

        if (toggle && toggle.enabled) {
            const currentStrategy = this.strategies[toggle.strategy];
            return currentStrategy && currentStrategy.isEnabled(toggle.parameters, context);
        } else {
            return false;
        }
    }
}

module.exports = Unleash;
