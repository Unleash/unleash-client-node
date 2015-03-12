var unleash = require('unleash-client-node');
unleash.initialize({
    url: 'http://unleash.herokuapp.com/features'
});

console.log("Fetching toggles from: http://unleash.herokuapp.com");

setInterval(function() {
    console.log("featureX enabled: " + unleash.isEnabled("featureX"));
}, 1000);
