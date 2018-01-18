# unleash-client-node

[![Greenkeeper badge](https://badges.greenkeeper.io/Unleash/unleash-client-node.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/Unleash/unleash-client-node.svg?branch=master)](https://travis-ci.org/Unleash/unleash-client-node)
[![Code Climate](https://codeclimate.com/github/Unleash/unleash-client-node/badges/gpa.svg)](https://codeclimate.com/github/Unleash/unleash-client-node)
[![Coverage Status](https://coveralls.io/repos/github/Unleash/unleash-client-node/badge.svg?branch=master)](https://coveralls.io/github/Unleash/unleash-client-node?branch=master)

This is the node client for Unleash. Read more about the
[Unleash project](https://github.com/finn-no/unleash)

**Version 3.x of the client requires `unleash-server` v3.x or higher.**

## Getting started

### 1. Initialize unleash-client

You should as early as possible in your node (web) app initialize the unleash-client. The
unleash-client will set-up a in-memory repository, and poll updates from the unleash-server at
regular intervals.

```js
const { initialize } = require('unleash-client');
const instance = initialize({
    url: 'http://unleash.herokuapp.com/api/',
    appName: 'my-app-name',
    instanceId: 'my-unique-instance-id',
});

// optional events
instance.on('error', console.error);
instance.on('warn', console.warn);
instance.on('ready', console.log);

// metrics hooks
instance.on('registered', clientData => console.log('registered', clientData));
instance.on('sent', payload => console.log('metrics bucket/payload sent', payload));
instance.on('count', (name, enabled) => console.log(`isEnabled(${name}) returned ${enabled}`));
```

### 2. Use unleash

After you have initialized the unleash-client you can easily check if a feature toggle is enabled or
not.

```js
const { isEnabled } = require('unleash-client');
isEnabled('app.ToggleX');
```

### 3. Stop unleash

To shut down the client (turn off the polling) you can simply call the destroy-method. This is
typically not required.

```js
const { destroy } = require('unleash-client');
destroy();
```

### Built in activation strategies

The client comes with implementations for the built-in activation strategies provided by unleash.

* DefaultStrategy
* UserIdStrategy
* GradualRolloutUserIdStrategy
* GradualRolloutSessionIdStrategy
* GradualRolloutRandomStrategy
* RemoteAddressStrategy
* ApplicationHostnameStrategy

Read more about the strategies in
[activation-strategy.md](https://github.com/Unleash/unleash/blob/master/docs/activation-strategies.md).

### Unleash context

In order to use some of the common activation strategies you must provide a
[unleash-context](https://github.com/Unleash/unleash/blob/master/docs/unleash-context.md). This
client SDK allows you to send in the unleash context as part of the `isEnabled` call:

```javascript
const context = {
    userId: '123',
    sessionId: 'some-session-id',
    remoteAddress: '127.0.0.1',
};
unleash.isEnabled('someToggle', unleashContext);
```

## Advanced usage

The initialize method takes the following arguments:

* **url** - the url to fetch toggles from. (required)
* **appName** - the application name / codebase name
* **instanceId** - an unique identifier, should/could be somewhat unique
* **refreshInterval** - The poll-intervall to check for updates. Defaults to 15s.
* **metricsInterval** - How often the client should send metrics to Unleash API
* **strategies** - Custom activation strategies to be used.
* **disableMetrics** - disable metrics
* **customHeaders** - Provide a map(object) of custom headers to be sent to the unleash-server

## Custom strategies

### 1. implement the custom strategy:

```js
const { Strategy, initialize } = require('unleash-client');
class ActiveForUserWithEmailStrategy extends Strategy {
    constructor() {
        super('ActiveForUserWithEmail');
    }

    isEnabled(parameters, context) {
        return parameters.emails.indexOf(context.email) !== -1;
    }
}
```

### 2. register your custom strategy:

```js
initialize({
    url: 'http://unleash.herokuapp.com',
    strategies: [new ActiveForUserWithEmailStrategy()],
});
```

## Alternative usage

Its also possible to ship the unleash instance around yourself, instead of using on the default
`require.cache` to have share one instance.

```js
const { Unleash } = require('unleash-client');

const instance = new Unleash({
    appName: 'my-app-name',
    url: 'http://unleash.herokuapp.com',
});

instance.on('ready', console.log.bind(console, 'ready'));
// required error handling when using instance directly
instance.on('error', console.error);
```
