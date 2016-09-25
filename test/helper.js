'use strict';
const fs = require('fs');

const backupPath = '/tmp/unleash-test';
const backupFile = `${backupPath}/unleash-repo.json`;

if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath);
}

module.exports = {
    backupPath,
    removeBackup () {
        if (fs.existsSync(backupFile)) {
            fs.unlinkSync(backupFile);
        }
    },
};
