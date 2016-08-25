'use strict';
const UnleashClient     = require('./lib/client');
const Repository        = require('./lib/repository');
const PollingRepository = require('./lib/polling-repository');
const Strategy          = require('./lib/strategy');
const DefaultStrategy   = require('./lib/default-strategy');
const backupPath        = require('os').tmpdir();

let client;
let repository;

function initialize (opt) {
    if (!opt || !opt.url) {
        throw new Error('You must specify the Unleash api url');
    }

    repository = new PollingRepository({
        url: opt.url,
        refreshIntervall: opt.refreshIntervall || 15 * 1000,
        backupPath: opt.backupPath || backupPath,
    });


    const strategies = [
        new DefaultStrategy(),
    ].concat(opt.strategies || []);

    client = new UnleashClient(repository, strategies);
}

function destroy () {
    if (repository) {
        repository.stop();
    }
    repository = undefined;
    client = undefined;
}

function isEnabled (name, context) {
    if (client) {
        return client.isEnabled(name, context);
    } else {
        console.log('WARN: Unleash has not been initalized jet');
        return false;
    }
}

module.exports = {
    initialize,
    destroy,
    isEnabled,
    Client: UnleashClient,
    Strategy,
    Repository,
};
