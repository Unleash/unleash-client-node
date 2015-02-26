var UnleashClient = require('./lib/client');
var Repository = require('./lib/repository');
var options = {};
var client;

function init(url, strategies, refreshIntervall) {
  if(!url) {
    throw new Error("You must specify the Unleash api url");
  }

  options.url = url;
  options.refreshIntervall = refreshIntervall || 15000;

  repository = new Repository(options);
  client = new UnleashClient(repository);
}

function getClient() {
  if(!client) {
    throw new Error("Did you initalize unleash via the init-method?");
  }
  return client;
}

module.exports = {
  init: init,
  getClient: getClient
};
