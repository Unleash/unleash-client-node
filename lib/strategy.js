'use strict';

class Strategy {
    constructor (name) {
        this.name = name || 'unknown';
    }

    isEnabled () {
        return false;
    }
}

module.exports = Strategy;
