const { initialize, getVariant } = require('../lib');

const client = initialize({
    appName: 'my-application',
    url: 'https://unleash.herokuapp.com/api/',
});

client.on('error', console.error);
client.on('warn', console.log);

console.log('Fetching toggles from: http://unleash.herokuapp.com');

setInterval(() => {
    console.log(`featureX enabled`, getVariant('Test.variants', { userId: `${Math.random()}` }));
}, 1000);
