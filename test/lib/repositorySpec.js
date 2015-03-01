var fs = require('fs');
var nock = require('nock');
var assert = require('assert');
var repository = require('../../lib/repository');

describe('Repository', function() {
  beforeEach(function() {
    setupToggles([{name: "feature",enabled: true,strategy: "default"}]);
  });

  afterEach(function() {
    fs.unlink('/tmp/unleash-repo.json', function(err) {});
    repository.destroy();
    nock.cleanAll();
  });

  it('should fetch toggles from server', function(done) {
    var t = setInterval(function() {
      if(repository.getToggle('feature')) {
        assert.ok(repository.getToggle('feature'));
        done();
        clearInterval(t);
      }
    }, 5);
  });
});

function setupToggles(toggles) {
  nock('http://unleash.app')
    .persist()
    .get('/features')
    .reply(200,  {features: toggles});
}
