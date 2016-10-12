const { Strategy, initialize, isEnabled } = require('../lib');

// Define custom strategy:
class ActiveForUserWithEmailStrategy extends Strategy {
    constructor () {
        super('ActiveForUserWithEmail');
    }

    isEnabled (parameters, context) {
        return parameters.emails.includes(context.email);
    }
}

const client = initialize({
    url: 'http://unleash.herokuapp.com/features',
    refreshInterval: 10000,
    strategies: [new ActiveForUserWithEmailStrategy()],
});

console.log('Fetching toggles from: http://unleash.herokuapp.com', client);

setInterval(() => {
    console.log(`featureX enabled: ${isEnabled('featureX', { email: 'user@mail.com' })}`);
}, 1000);
