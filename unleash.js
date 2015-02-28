var UnleashClient = require('./lib/client');
var Repository = require('./lib/repository');
var options = {};
var client;

function initialize(opt) {
  if(!opt || !opt.url) {
    throw new Error("You must specify the Unleash api url");
  }

  options.url = opt.url;
  options.refreshIntervall = opt.refreshIntervall || 15000;

  repository = new Repository(options);
  client = new UnleashClient(repository);
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
