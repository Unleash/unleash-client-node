var request = require('request');
var fs = require('fs');

var backupFile = "/tmp/unleash-repo.json";
var repository = {};
var etag;
var timer;

function saveBackup() {
  fs.writeFile(backupFile, JSON.stringify(repository), function(err) {
    if(err) {
        console.log(err);
    }
  });
}

function loadBackup() {
  fs.readFile(backupFile, function(err, data) {
    if (err) {
      console.log("Error reading unleash bakcup file");
      return;
    } else {
      try {
        repository = JSON.parse(data);
      } catch(error) {
        console.log("unable to parse the Unleash backup file");
      }
    }
  });
}

function buildRepository(toggles) {
  var repo = {};
  toggles.forEach(function(toggle) {
    repo[toggle.name] = toggle;
  });
  repository = repo;
  saveBackup();
}

function fetch(url) {
  request({
    url: url,
    headers: {'If-None-Match': etag}
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        try {
          var toggles = JSON.parse(body).features;
          buildRepository(toggles);
          etag = response.headers.etag;
        } catch(err) {
          console.log("Unleash failed parsing toggles: " + err);
        }
      }
  });
}

function initialize(options) {
  if(timer) {
    destroy();
  }

  backupFile = options.backupPath + "/unleash-rep.json";

  loadBackup();

  //Perform inital fetch
  fetch(options.url);

  //Setup fetch interval
  timer = setInterval(fetch, options.refreshIntervall, options.url);
  timer.unref();
}

function getToggle(name) {
  return repository[name];
}

function destroy() {
  clearInterval(timer);
}

module.exports = {
  initalize: initialize,
  getToggle: getToggle,
  destroy: destroy
};
