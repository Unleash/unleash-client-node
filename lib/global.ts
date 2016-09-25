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

import unleash from './unleash';

export { Strategy } from './strategy';

export default function initialize (options) {
    const instance = unleash.initialize(options);

        


}

export function isEnabled () {

}