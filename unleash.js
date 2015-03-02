var UnleashClient     = require('./lib/client');
var Repository        = require('./lib/repository');
var PollingRepository = require('./lib/polling-repository');
var Strategy          = require('./lib/strategy');
var DefaultStrategy   = require('./lib/default-strategy');
var backupPath        = require('os').tmpdir();

var client;
var repository;

function initialize(opt) {
  if(!opt || !opt.url) {
    throw new Error("You must specify the Unleash api url");
  }

  repository = new PollingRepository({
    url: opt.url,
    refreshIntervall: opt.refreshIntervall || 15*1000,
    backupPath: opt.backupPath || backupPath
  });


  var strategies = [
    new DefaultStrategy()
  ].concat(opt.strategies || []);

  client = new UnleashClient(repository, strategies);
}

function destroy() {
  if(repository) {
    repository.stop();
  }
  repository = undefined;
  client = undefined;
}

function getClient() {
  if(!client) {
    throw new Error("Did you initalize Unleash?");
  }
  return client;
}

function isEnabled(name, context) {
  if(client) {
    return client.isEnabled(name, context);
  } else {
    console.log("Unleash has not been initalized jet");
  }

}

module.exports = {
  initialize: initialize,
  destroy: destroy,
  getClient: getClient,
  isEnabled: isEnabled,
  Client: UnleashClient,
  Strategy: Strategy,
  Repository: Repository
};
