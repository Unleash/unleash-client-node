var UnleashClient = require('./lib/client');
var repository = require('./lib/repository');
var DefaultStrategy = require('./lib/default-strategy');

var client;

var strategies = [
  new DefaultStrategy()
];

function initialize(opt) {
  if(client) {
    console.log("You may only initalize unleash once.");
    return;
  }

  if(!opt || !opt.url) {
    throw new Error("You must specify the Unleash api url");
  }

  repository.initalize({
    url: opt.url,
    refreshIntervall: opt.refreshIntervall || 15000
  });

  client = new UnleashClient(repository, strategies);
}

function getClient() {
  if(!client) {
    throw new Error("Did you initalize unleash via the inititalize-method?");
  }
  return client;
}

module.exports = {
  initialize: initialize,
  getClient: getClient
};
