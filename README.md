# Unleash Client SDK for Node.js

![npm](https://img.shields.io/npm/v/unleash-client)
![npm](https://img.shields.io/npm/dm/unleash-client)
[![Greenkeeper badge](https://badges.greenkeeper.io/Unleash/unleash-client-node.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/Unleash/unleash-client-node.svg?branch=master)](https://travis-ci.org/Unleash/unleash-client-node)
[![Code Climate](https://codeclimate.com/github/Unleash/unleash-client-node/badges/gpa.svg)](https://codeclimate.com/github/Unleash/unleash-client-node)
[![Coverage Status](https://coveralls.io/repos/github/Unleash/unleash-client-node/badge.svg?branch=master)](https://coveralls.io/github/Unleash/unleash-client-node?branch=master)

Unleash Client SDK for Node.js. It is compatible with the
[Unleash-hosted.com SaaS offering](https://www.unleash-hosted.com/) and
[Unleash Open-Source](https://github.com/finn-no/unleash).

## Getting started

### 1. Install the unleash-client into your project

```bash
$ npm install unleash-client --save
```

### 2. Initialize unleash-client

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

### 3. Use unleash

After you have initialized the unleash-client you can easily check if a feature toggle is enabled or
not.

```js
const {
    isEnabled,
    getVariant,
    getFeatureToggleDefinition,
    getFeatureToggleDefinitions,
} = require('unleash-client');

isEnabled('app.ToggleX');

const { enabled, name, payload } = getVariant('app.ToggleY', { userId: '1234' });

const featureToogleX = getFeatureToggleDefinition('app.ToggleX');
const featureToggles = getFeatureToggleDefinitions();
```

### 4. Stop unleash

To shut down the client (turn off the polling) you can simply call the destroy-method. This is
typically not required.

```js
const { destroy } = require('unleash-client');
destroy();
```

### Built in activation strategies

The client comes with implementations for the built-in activation strategies provided by unleash.

-   DefaultStrategy
-   UserIdStrategy
-   GradualRolloutUserIdStrategy
-   GradualRolloutSessionIdStrategy
-   GradualRolloutRandomStrategy
-   RemoteAddressStrategy
-   ApplicationHostnameStrategy

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

-   **url** - the url to fetch toggles from. (required)
-   **appName** - the application name / codebase name (required)
-   **instanceId** - an unique identifier, should/could be somewhat unique
-   **refreshInterval** - The poll-intervall to check for updates. Defaults to 15000ms.
-   **metricsInterval** - How often the client should send metrics to Unleash API. Defaults to
    60000ms.
-   **strategies** - Custom activation strategies to be used.
-   **disableMetrics** - disable metrics
-   **customHeaders** - Provide a map(object) of custom headers to be sent to the unleash-server
-   **customHeadersFunction** - Provide a function that return a Promise resolving as custom headers
    to be sent to unleash-server. When options are set, this will take precedence over
    `customHeaders` option.
-   **timeout** - specify a timeout in milliseconds for outgoing HTTP requests. Defaults to 10000ms.
-   **repository** - Provide a custom repository implementation to manage the underlying data

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

## Events

The unleash instance object implements the EventEmitter class and **emits** the following events:

| event      | payload                          | description                                                                                                                        |
| ---------- | -------------------------------- | -----------------------------------------------------------------------------------------------------------------------------------|
| ready      | -                                | is emitted once the fs-cache is ready. if no cache file exists it will still be emitted. toggle states are available at this point |
| registered | -                                | is emitted after the app has been registered at the api server                                                                     |
| sent       | `object` data                    | key/value pair of delivered metrics                                                                                                |
| count      | `string` name, `boolean` enabled | is emitted when a feature is evaluated                                                                                             |
| warn       | `string` msg                     | is emitted on a warning                                                                                                            |
| error      | `Error` err                      | is emitted on a error                                                                                                              |
| unchanged  | -                                | is emitted each time the client gets new toggle state from server, but nothing has changed                                         |
| changed    | `object` data                    | is emitted each time the client gets new toggle state from server and changes has been made                                        |
|            |

Example usage:

```js
const { initialize, isEnabled } = require('unleash-client');

const instance = initialize({
    appName: 'my-app-name',
    url: 'http://unleash.herokuapp.com/api/',
});

instance.once('registered', () => {
    // Do something after the client has registered with the server api.
    // NB! It might not have recieved updated feature toggles yet.
});

instance.once('changed', () => {
    console.log(`Demo is enabled: ${isEnabled('Demo')}`);
});
```

## Custom repository

You can manage the underlying data layer yourself if you want to. This enables you to use unleash
offline, from a browser environment or implement your own caching layer. See
[example](examples/custom_repository.js).

Unleash depends on a `ready` event of the repository you pass in. Be sure that you emit the event
**after** you've initialized unleash.
