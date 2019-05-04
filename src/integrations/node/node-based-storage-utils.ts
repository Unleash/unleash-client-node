import {join} from 'path';

import * as fs from 'fs';

function readFile(path: string, encoding: string, callback: (err: any, data: any) => void): void {
    fs.readFile(path, encoding, callback);
}

function writeFile(path: string, data: any, callback: (err: any) => void): void {
    fs.writeFile(path, data, callback);
}


export {
    join, writeFile, readFile
}
