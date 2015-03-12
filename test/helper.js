var fs = require('fs');

var backupPath = "/tmp/unleash-test";
var backupFile = backupPath + '/unleash-repo.json';

if(!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath);
}

module.exports = {
    backupPath: backupPath,
    removeBackup: function() {
        if(fs.existsSync(backupFile)) {
            fs.unlinkSync(backupFile);
        }
    }
};
