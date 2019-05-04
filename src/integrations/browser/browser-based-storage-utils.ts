import { join } from 'bfs-path';
//TODO: Once BrowserFS upgrades their "@types/node" to "11.9.0+" we can integrate that, remember BrowserFS is  a superior library
import * as fs from 'localstorage-fs';

const { readFile, writeFile } = fs;

export { join, readFile, writeFile };
