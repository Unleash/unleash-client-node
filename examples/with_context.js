const { initialize, isEnabled } = require('../lib');

const client = initialize({
    appName: 'my-application',
    url: 'http://unleash.herokuapp.com/api/',
});

client.on('error', console.error);
client.on('warn', console.log);

console.log('Fetching toggles from: http://unleash.herokuapp.com');

setInterval(() => {
    const context = {
        userId: '123',
        sessionId: Math.round(Math.random() * 1000),
        remoteAddress: '127.0.0.1',
    };
    const toggleName = 'app.demo';
    console.log(`${toggleName} enabled: ${isEnabled(toggleName, context)}`);
}, 1000);
