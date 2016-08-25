'use strict';

class Strategy {
    constructor (name = 'unknown') {
        this.name = name;
    }

    getName () {
        return this.name;
    }

    isEnabled () {
        return false;
    }
}

module.exports = Strategy;
