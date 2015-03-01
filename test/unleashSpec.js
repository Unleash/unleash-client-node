var unleash = require('../unleash');
var expect = require('expect.js');
var assert = require('assert');
var nock = require('nock');
var fs = require('fs');

describe('The Unleash api', function () {
  beforeEach(function() {
    setupToggles([{name: "feature",enabled: true,strategy: "default"}]);
  });

  afterEach(function() {
    fs.unlink('/tmp/unleash-repo.json', function(err) {});
    unleash.destroy();
    nock.cleanAll();
  });

  it('should require initialize to be called first', function() {
    expect(unleash.getClient).to.throwError();
  });

  it('should return the unleash-client', function() {
    unleash.initialize({url: 'http://unleash.app/features'});
    assert.ok(unleash.getClient());
  });

  it('should consider toggle active', function(done) {
    unleash.initialize({url: 'http://unleash.app/features'});

    var client = unleash.getClient();

    setTimeout(function() {
      assert.ok(client.isEnabled('feature'));
      done();
    }, 40);
  });
});

function setupToggles(toggles) {
  nock('http://unleash.app')
    .persist()
    .get('/features')
    .reply(200,  {features: toggles});
}
