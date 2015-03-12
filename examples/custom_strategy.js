var unleash = require('unleash-client');
var util = require('util');

unleash.initialize({
    url: 'http://unleash.herokuapp.com/features',
    refreshIntervall: 10000,
    strategies: [new ActiveForUserWithEmailStrategy()]
});

console.log("Fetching toggles from: http://unleash.herokuapp.com");

setInterval(function() {
    console.log("featureX enabled: " + unleash.isEnabled("featureX", {email: 'user@mail.com'}));
}, 1000);


//Define custom strategy:
function ActiveForUserWithEmailStrategy() {
    this.name = 'ActiveForUserWithEmail';
}

util.inherits(ActiveForUserWithEmailStrategy, unleash.Strategy);

ActiveForUserWithEmailStrategy.prototype.isEnabled = function(parameters, context) {
    return parameters.emails.indexOf(context.email) !== -1;
};
