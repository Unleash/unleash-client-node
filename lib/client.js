'use strict';

class Unleash {
    constructor (repository, strategies) {
        this.repository = repository;
        this.strategies = {};

        strategies.forEach(strategy => {
            if (!strategy || !strategy.name) {
                throw new Error('Invalid strategy data');
            }

            // TODO validate
            console.log('strategy:', strategy.name);
            this.strategies[strategy.name] = strategy;
        });
    }

    isEnabled (name, context) {
        const toggle = this.repository.getToggle(name);

        if (toggle && toggle.enabled) {
            return toggle.strategies
                .some((strategy) => {
                    if (!this.strategies[strategy.name]) {
                        throw new Error(`Missing strategy ${strategy.name}`);
                    }
                    return this.strategies[strategy.name].isEnabled(toggle.parameters, context);
                });
        } else {
            return false;
        }
    }
}

module.exports = Unleash;
