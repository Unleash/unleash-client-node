'use strict';
const { initialize, isEnabled } = require('../');

initialize({
    url: 'http://unleash.herokuapp.com/features',
});

console.log('Fetching toggles from: http://unleash.herokuapp.com');

setInterval(() => {
    console.log(`featureX enabled: ${isEnabled('featureX')}`);
}, 1000);
