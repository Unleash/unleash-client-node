'use strict';
const client = require('./unleash');
const express = require('../../unleash-ui-work/node_modules/express');
const app = express();

app.get('/', (req, res) => {
    console.log('handler');
    res.json({features: [
        {
            "name": "featureX",
            "description": "",
            "enabled": true,
            "strategy": "default",
            "parameters": {},
            "strategies": [
                {
                    "name": "some_strategy",
                    "parameters": {}
                }
            ]
        },
        {
            "name": "featureY",
            "description": "",
            "enabled": true,
            "strategy": "default",
            "parameters": {},
            "strategies": [
                {
                    "name": "some_strategy",
                    "parameters": {
                        "emails": "me@mail.com"
                    }
                }
            ]
        }
    ]});
})

app.listen(1234);


class SomeStrategy {
    constructor () {
        this.name = 'some_strategy';
    }

    isEnabled () {
        return true;
    }
}

const strategies = [ new SomeStrategy() ];

const unleash = client.initialize({
    url: 'http://localhost:1234',
    strategies,
    errorHandler: (err) => console.error(err)
});


console.log('featureX', unleash.isEnabled('feature-1'))

setInterval(() => {
    console.log('featureX', unleash.isEnabled('featureX'));
    console.log('featureY', unleash.isEnabled('featureY'));
}, 5000);