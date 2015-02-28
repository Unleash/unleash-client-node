var unleash = require('./unleash');
unleash.initialize({url: 'http://unleash.herokuapp.com/features', refreshIntervall: 1000});

unleashClient = unleash.getClient();

setInterval(function() {
  console.log(unleashClient.isEnabled("featureX"));
  //unleash.stop();
}, 1500);
