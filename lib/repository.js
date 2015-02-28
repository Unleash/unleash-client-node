var request = require('request');

var repository = {};
var etag;
var timer;

function fetch(url) {
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

function initialize(options) {
  url = options.url;

  //Perform inital fetch
  fetch(url);

  //Setup fetch interval
  timer = setInterval(fetch, options.refreshIntervall, url);
  timer.unref();
}

function getToggle(name) {
  return repository[name];
}

function stop() {
  clearInterval(timer);
}

module.exports = {
  initalize: initialize,
  getToggle: getToggle,
  stop: stop
};
