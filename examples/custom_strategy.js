'use strict';
const { Strategy, initialize, isEnabled } = require('../');

// Define custom strategy:
class ActiveForUserWithEmailStrategy extends Strategy {
    constructor () {
        super('ActiveForUserWithEmail');
    }

    isEnabled (parameters, context) {
        return parameters.emails.indexOf(context.email) !== -1;
    }
}

const client = initialize({
    url: 'http://unleash.herokuapp.com/features',
    refreshIntervall: 10000,
    strategies: [new ActiveForUserWithEmailStrategy()],
});

console.log('Fetching toggles from: http://unleash.herokuapp.com');

setInterval(() => {
    console.log(`featureX enabled: ${isEnabled('featureX', { email: 'user@mail.com' })}`);
}, 1000);


