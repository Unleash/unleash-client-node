var request = require('request');

var repository = {};
var url;
var etag;

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
          console.log("error parsing toggles: " + err);
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
  setInterval(fetch, options.refreshIntervall).unref();
}

Repository.prototype.get = function get(name) {
  return repository[name];
};

module.exports = Repository;
