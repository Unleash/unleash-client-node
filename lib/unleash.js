'use strict';
const Client = require('./client');
const Repository = require('./repository');
const Strategy = require('./strategy');
const BACKUP_PATH = require('os').tmpdir();


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

    * nytt og gammel format
        * normalisere backupfil og server
            * normalisere til nytt format
                strategies: [{ name, parameters }]

*/


/* TODO:
    * flate ut


*/

function requiredUrl () {
    throw new Error('You must specify the Unleash API URL');
}

function initialize ({
    url = requiredUrl(),
    refreshIntervall = 15 * 1000,
    backupPath = BACKUP_PATH,
    strategies = [],
    errorHandler = () => {},
} = {}) {
    const repository = new Repository({
        url,
        refreshIntervall,
        backupPath,
    });

    repository.on('error', errorHandler);

    let client;
    repository.on('ready', () => {
        console.log('client ready', strategies);
        client = new Client(repository, strategies, errorHandler);
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
                // todo should maybe be a warn?
                // errorHandler(
                //     new Error(`${Date.now()} WARN: Unleash has not been initalized yet. isEnabled(${name}) defaulted to false`)
                // );
                console.log(`${Date.now()} WARN: Unleash has not been initalized yet. isEnabled(${name}) defaulted to false`);
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
