var fs = require('fs');
var backupFileName = "/unleash-repo.json";

function Repository(options) {
    this._repository = {};
    this.backupFile = options.backupPath + backupFileName;
    this._loadBackup();
}

Repository.prototype._setToggles = function(toggles) {
    var repo = {};

    toggles.forEach(function(toggle) {
        repo[toggle.name] = toggle;
    });

    this._repository = repo;
    this._saveBackup(repo);
};

Repository.prototype._setRepository = function(repository) {
    this.repository = repository;
};

Repository.prototype.getRepository = function() {
    return this._repository;
};

Repository.prototype.getToggle = function(name) {
    return this._repository[name];
};

Repository.prototype._saveBackup = function(repository) {
    fs.writeFile(this.backupFile, JSON.stringify(repository), function(err) {
        if(err) {
            console.log(err);
        }
    });
};

Repository.prototype._loadBackup = function() {
    var save = this._setRepository;
    fs.readFile(this.backupFile, function(err, data) {
        if (err) {
            if(err.errno !== 34) {
                console.log("Error reading unleash bakcup file");
            }
        } else {
            try {
                save(JSON.parse(data));
            } catch(error) {
                console.log("Error parsing the Unleash backup file", error);
            }
        }
    });
};

module.exports = Repository;
