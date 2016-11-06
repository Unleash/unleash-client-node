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
    appName: 'my-application',
    url: 'http://unleash.herokuapp.com/',
    refreshInterval: 10000,
    strategies: [new ActiveForUserWithEmailStrategy()],
});

client.on('error', console.error);
client.on('warn', console.log);

console.log('Fetching toggles from: http://unleash.herokuapp.com', client);

setInterval(() => {
    console.log(`featureX enabled: ${isEnabled('featureX', { email: 'user@mail.com' })}`);
}, 1000);
