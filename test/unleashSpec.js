var unleash = require('../unleash');
var expect = require('expect.js');
var assert = require('assert');
var nock = require('nock');

describe('The unleash factory api', function () {
    it('Should require initialize to be called first', function() {
      expect(unleash.getClient).to.throwError();
    });

    it('Should return the unleash-client', function() {
      nock('http://unleash.herokuapp.com')
          .get('/features')
          .reply(200,  {features: []});

      unleash.initialize({url: 'http://unleash.herokuapp.com/features'});
      assert.ok(unleash.getClient());
      nock.cleanAll();
    });
});

describe('The unleash should be easy to use', function() {
  beforeEach(function() {
    nock('http://unleash.herokuapp.com')
        .get('/features')
        .reply(200,  {
          features: [
            {
              name: "feature",
              enabled: true,
              strategy: "default"
            }]
          });
  });

  afterEach(function() {
    nock.cleanAll();
  });

  it('Toggle should be enabled', function(done) {
    unleash.initialize({url: 'http://unleash.herokuapp.com/features'});

    var client = unleash.getClient();

    setTimeout(function() {
      assert.ok(client.isEnabled('feature'));
      done();
    }, 40);
  });
});
