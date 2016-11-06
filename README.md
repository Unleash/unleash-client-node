# unleash-client-node
[![Build Status](https://travis-ci.org/Unleash/unleash-client-node.svg?branch=master)](https://travis-ci.org/Unleash/unleash-client-node)
[![Code Climate](https://codeclimate.com/github/Unleash/unleash-client-node/badges/gpa.svg)](https://codeclimate.com/github/Unleash/unleash-client-node)
[![Coverage Status](https://coveralls.io/repos/github/Unleash/unleash-client-node/badge.svg?branch=master)](https://coveralls.io/github/Unleash/unleash-client-node?branch=master)
[![dependencies Status](https://david-dm.org/Unleash/unleash-client-node/status.svg)](https://david-dm.org/Unleash/unleash-client-node)
[![devDependencies Status](https://david-dm.org/Unleash/unleash-client-node/dev-status.svg)](https://david-dm.org/Unleash/unleash-client-node?type=dev)

This is the node client for Unleash. Read more about the [Unleash project](https://github.com/finn-no/unleash)

## Getting started

### 1. Initialize unleash-client
You should as early as possible in your node (web) app initialize the
unleash-client.  The unleash-client will set-up a in-memory repository,
and poll updates from the unleash-server at regular intervals.

```js
const { initialize } = require('unleash-client');
const instance = initialize({
    url: 'http://unleash.herokuapp.com',
    appName: 'my-app-name',
    instanceId: 'my-unique-instance-id',
});

// optional events
instance.on('error', console.error);
instance.on('warn', console.warn);
instance.on('ready', console.log);

// metrics hooks
instance.on('registered', (clientData) => console.log('registered', clientData));
instance.on('sent', (payload) => console.log('metrics bucket/payload sent', payload));
instance.on('count', (name, enabled) => console.log(`isEnabled(${name}) returned ${enabled}`));
```

### 2. Use unleash
After you have initialized the unleash-client you can easily check if a feature
toggle is enabled or not.

```js
const { isEnabled } = require('unleash-client');
isEnabled('app.ToggleX');
```

### 3. Stop unleash
To shut down the client (turn off the polling) you can simply call the
destroy-method. This is typically not required.

```js
const { destroy } = require('unleash-client');
destroy();
```




## Advanced usage
The initialize method takes the following arguments:

- **url** - the url to fetch toggles from. (required)
- **appName** - the application name / codebase name
- **instanceId** - an unique identifier, should/could be somewhat unique
- **refreshIntervall** - The poll-intervall to check for updates. Defaults to 15s.
- **strategies** - Custom activation strategies to be used.
- **disableMetrics** - disable metrics


## Custom strategies

### 1. implement the custom strategy:
```js
const { Strategy, initialize } = require('unleash-client');
class ActiveForUserWithEmailStrategy extends Strategy {
    constructor() {
        super('ActiveForUserWithEmail');
    }

    isEnabled (parameters, context) {
        return parameters.emails.indexOf(context.email) !== -1;
    }
}
```

### 2. register your custom strategy:

```js
initialize({
    url: 'http://unleash.herokuapp.com',
    strategies: [new ActiveForUserWithEmailStrategy()]
});
```

## Alternative usage
Its also possible to ship the unleash instance around yourself, instead of using on the default `require.cache` to have share one instance.

```js
const { Unleash } = require('unleash-client');


const instance = new Unleash({
    appName: 'my-app-name',
    url: 'http://unleash.herokuapp.com'
});

instance.on('ready', console.log.bind(console, 'ready'));
// required error handling when using instance directly
instance.on('error', console.error);

```
