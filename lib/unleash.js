'use strict';
const Client = require('./client');
const Repository = require('./repository');
const PollingRepository = require('./polling-repository');
const Strategy = require('./strategy');
const DefaultStrategy = require('./default-strategy');
const backupPath = require('os').tmpdir();


/*
    # Client.

    * typescript
    * starte umiddelbart
        - backup fil leses async umiddelbart ( rask timeout / feilhåndtering )
            - så lese/samtidig fra server (SERVER vinner alltid)
                - lagre resultat
            - polling
    * ikke feile, MEN surface errors/logs til tester
    * skal plukke data ut fra payload (ikke validere hele payload)

    # Aggregate strategies:

    *

*/


function initialize (opt) {
    if (!opt || !opt.url) {
        throw new Error('You must specify the Unleash api url');
    }
    const repository = new PollingRepository({
        url: opt.url,
        refreshIntervall: opt.refreshIntervall || 15 * 1000,
        backupPath: opt.backupPath || backupPath,
    });

    const strategies = [
        new DefaultStrategy(),
    ].concat(opt.strategies || []);

    let client;
    repository.on('ready', () => {
        client = new Client(repository, strategies);
    });


    return {
        destroy () {
            if (repository) {
                repository.stop();
            }
            client = undefined;
        },
        isEnabled (name, context) {
            if (client) {
                return client.isEnabled(name, context);
            } else {
                console.log(`WARN: Unleash has not been initalized yet. isEnabled(${name}) defaulted to false`);
                return false;
            }
        },
    };
}


module.exports = {
    initialize,
    Client,
    Strategy,
    Repository,
};
