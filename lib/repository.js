var request = require('request');

var repository = {};
var url;
var etag;
var timer;

function fetch() {

  request({
    url: url,
    headers: {'If-None-Match': etag}
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var toggles;
        try {
          toggles =  JSON.parse(body).features;
        } catch(err) {
          console.log("Unleash reach error when parsing toggles: " + err);
        }

        etag = response.headers.etag;
        toggles.forEach(function(toggle) {
          repository[toggle.name] = toggle;
        });
      }
  });
}

function Repository(options) {
  url = options.url;

  //Perform inital fetch
  fetch();

  //Setup fetch interval
  timer = setInterval(fetch, options.refreshIntervall);
  timer.unref();
}

Repository.prototype.get = function get(name) {
  return repository[name];
};

Repository.prototype.stop = function() {
  clearInterval(timer);
};

module.exports = Repository;
