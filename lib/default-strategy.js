'use strict';
const Strategy = require('./strategy');

class DefaultStrategy extends Strategy {
    constructor () {
        super();
        this.name = 'default';
    }

    isEnabled () {
        return true;
    }
}

module.exports = DefaultStrategy;
