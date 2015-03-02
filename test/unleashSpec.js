var unleash = require('../unleash');
var expect = require('expect.js');
var assert = require('assert');
var nock = require('nock');
var fs = require('fs');

var backupPath = "/tmp/unleash-test";
var backupFile = backupPath + '/unleash-repo.json';

describe('The Unleash api', function () {
  beforeEach(function() {
    if(!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath);
    }

    setupToggles([{name: "feature",enabled: true,strategy: "default"}]);
  });

  afterEach(function() {
    if(fs.existsSync(backupFile)) {
      fs.unlinkSync(backupFile);
    }

    unleash.destroy();
    nock.cleanAll();
  });

  it('should require initialize to be called first', function() {
    expect(unleash.getClient).to.throwError();
  });

  it('should return the unleash-client', function() {
    unleash.initialize({url: 'http://unleash.app/features', backupPath: backupPath});
    assert.ok(unleash.getClient());
  });

  it('should consider toggle active', function(done) {
    unleash.initialize({url: 'http://unleash.app/features', backupPath: backupPath});

    var t = setInterval(function() {
      if(unleash.isEnabled('feature')) {
        clearInterval(t);
        assert.ok(unleash.isEnabled('feature'));
        done();
      }
    }, 10);
  });
});

function setupToggles(toggles) {
  nock('http://unleash.app')
    .persist()
    .get('/features')
    .reply(200,  {features: toggles});
}
