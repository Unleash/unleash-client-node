'use strict';

class Strategy {
    constructor (name) {
        this.name = name || 'unknown';
    }

    getName () {
        return this.name;
    }

    isEnabled () {
        return false;
    }
}

module.exports = Strategy;
