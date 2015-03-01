var unleash = require('./unleash');
var Strategy = require('./lib/strategy');
var util = require('util');

function ActiveForUserWithEmailStrategy() {
  this.name = 'ActiveForUserWithEmail';
}

util.inherits(ActiveForUserWithEmailStrategy, Strategy);

ActiveForUserWithEmailStrategy.prototype.isEnabled = function(parameters, context) {
  return parameters.emails.indexOf(context.email) !== -1;
};

unleash.initialize({
  url: 'http://unleash.herokuapp.com/features',
  refreshIntervall: 10000,
  strategies: [new ActiveForUserWithEmailStrategy()]
});

unleashClient = unleash.getClient();

setInterval(function() {
  console.log(unleashClient.isEnabled("featureX"));
  //unleash.stop();
}, 1000);
