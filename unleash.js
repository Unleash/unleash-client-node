var UnleashClient = require('./lib/unleash-client');
var Repository = require('./lib/repository');
var options = {};
var client;

function init(opt) {
  if(!opt || !opt.url) {
    throw new Error("You must specify the Unleash api url");
  }

  options.refreshIntervall = opt.refreshIntervall || 15000;
  options.url = opt.url;

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
