'use strict';
import unleash from './unleash';
import { Strategy } from './strategy';
import * as express from 'express';

let fixture = require('/Users/sverosak/Bit_Sync/Code/unleash-project/unleash-client-node/test/lib/fixtures/format-0.json');

const app = express();

app.get('/', (req, res) => {
    console.log('handler');
    res.json(fixture);
})

app.listen(1234);

class SomeStrategy extends Strategy {
    constructor (name = 'some_strategy') {
        super(name);
    }

    isEnabled () {
        return true;
    }
}

const strategies: Strategy[] = [ new SomeStrategy('default'), new SomeStrategy('ActiveForUserWithEmail'), new Strategy('default') ];

const unleashInstance = unleash({
    backupPath: __dirname,
    url: 'http://localhost:1234',
    strategies,
    errorHandler: (err: Error) => console.error(err)
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