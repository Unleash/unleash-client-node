'use strict';
import { Unleash, Strategy } from '../lib/unleash';
import * as express from 'express';

let fixture = require('../test/fixtures/format-0.json');

const app = express();
app.get('/', (req, res) => res.json(fixture));
app.listen(1234);

const strategies: Strategy[] = [ new Strategy('default', true), new Strategy('ActiveForUserWithEmail', true), new Strategy('default') ];

const unleashInstance = new Unleash({
    appName: 'super-app',
    backupPath: __dirname,
    url: 'http://localhost:1234',
    strategies,
});

console.log('featureX', unleashInstance.isEnabled('feature-1', {}))


unleashInstance.on('ready', () => {
    setTimeout(() => {
        console.log('featureX', unleashInstance.isEnabled('featureX', {}));
        console.log('featureY', unleashInstance.isEnabled('featureY', {}));
    }, 100)
});


setInterval(() => {
    console.log('featureX', unleashInstance.isEnabled('featureX', {}));
    console.log('featureY', unleashInstance.isEnabled('featureY', {}));
}, 5000);
