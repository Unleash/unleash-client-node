# Unleash Client SDK for Node.js

![npm](https://img.shields.io/npm/v/unleash-client)
![npm](https://img.shields.io/npm/dm/unleash-client)
[![Build Status](https://github.com/Unleash/unleash-client-node/workflows/Build/badge.svg)](https://github.com/Unleash/unleash-client-node/actions)
[![Code Climate](https://codeclimate.com/github/Unleash/unleash-client-node/badges/gpa.svg)](https://codeclimate.com/github/Unleash/unleash-client-node)
[![Coverage Status](https://coveralls.io/repos/github/Unleash/unleash-client-node/badge.svg?branch=master)](https://coveralls.io/github/Unleash/unleash-client-node?branch=master)

Unleash Client SDK for Node.js. It is compatible with:

- [Unleash Enterprise](https://www.unleash-hosted.com)
- [Unleash Open-Source](https://github.com/Unleash/unleash)

## Getting started

### 1. Install the unleash-client into your project

```bash
$ npm install unleash-client --save
```

### 2. Initialize unleash-client

It is recommended to initialize the Unleash client SDK as early as possible in your node.js
application. The SDK will set-up a in-memory repository, and poll updates from the unleash-server at
regular intervals.

```js
const { initialize } = require('unleash-client');
const unleash = initialize({
  url: 'http://unleash.herokuapp.com/api/',
  appName: 'my-app-name',
  instanceId: 'my-unique-instance-id',
  customHeaders: {
    Authorization: 'API token',
  },
});

unleash.on('synchronized', () => {
  // Unleash is ready to serve updated feature toggles.

  // Check a feature flag
  const isEnabled = unleash.isEnabled('some-toggle');

  // Check the variant
  const variant = unleash.getVariant('app.ToggleY');
});
```

Be aware that the `initialize` function will configure a _global_ Unleash instance. If you call this
method multiple times the global instance will be changed. If you prefer to handle the instance
yourself you should [construct your own Unleash instance](#alternative-usage).

#### Block until Unleash SDK has synchronized

You can also use the `startUnleash` function, and `await` for the SDK to have fully synchronized
with the unleash-api. This allows you to secure that the SDK is not operating on locally and
potential stale feature toggle configuration.

```js
const { startUnleash } = require('unleash-client');

const unleash = await startUnleash({
  appName: 'async-unleash',
  url: 'http://unleash.herokuapp.com/api/',
  customHeaders: {
    Authorization: 'API token',
  },
});

// Unleash SDK has now fresh state from the unleash-api
const isEnabled = unleash.isEnabled('Demo');
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

- DefaultStrategy
- UserIdStrategy
- FlexibleRolloutStrategy
- GradualRolloutUserIdStrategy
- GradualRolloutSessionIdStrategy
- GradualRolloutRandomStrategy
- RemoteAddressStrategy
- ApplicationHostnameStrategy

Read more about the strategies in
[activation-strategy.md](https://github.com/Unleash/unleash/blob/master/docs/activation-strategies.md).

### Unleash context

In order to use some of the common activation strategies you must provide a
[unleash-context](https://github.com/Unleash/unleash/blob/master/docs/unleash-context.md). This
client SDK allows you to send in the unleash context as part of the `isEnabled` call:

```javascript
const unleashContext = {
  userId: '123',
  sessionId: 'some-session-id',
  remoteAddress: '127.0.0.1',
};
unleash.isEnabled('someToggle', unleashContext);
```

## Advanced usage

The initialize method takes the following arguments:

- **url** - the url to fetch toggles from. (required)
- **appName** - the application name / codebase name (required)
- **environment** - the active environment this application is running in. Automatically populated to the Unleash Context. (Optional)
- **instanceId** - an unique identifier, should/could be somewhat unique
- **refreshInterval** - The poll-intervall to check for updates. Defaults to 15000ms.
- **metricsInterval** - How often the client should send metrics to Unleash API. Defaults to
  60000ms.
- **strategies** - Custom activation strategies to be used.
- **disableMetrics** - disable metrics
- **customHeaders** - Provide a map(object) of custom headers to be sent to the unleash-server
- **customHeadersFunction** - Provide a function that return a Promise resolving as custom headers
  to be sent to unleash-server. When options are set, this will take precedence over `customHeaders`
  option.
- **timeout** - specify a timeout in milliseconds for outgoing HTTP requests. Defaults to 10000ms.
- **repository** - Provide a custom repository implementation to manage the underlying data
- **httpOptions** - Provide custom http options such as `rejectUnauthorized` - be careful with these
  options as they may compromise your application security
- **namePrefix** - Only fetch feature toggles with the provided name prefix.
- **tags** - Only fetch feature toggles tagged with the list of tags. Eg: `[{type: 'simple', value: 'proxy'}]`. 

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
  customHeaders: {
    Authorization: 'API token',
  },
  strategies: [new ActiveForUserWithEmailStrategy()],
});
```

## Alternative usage

Its also possible to ship the unleash instance around yourself, instead of using on the default
`require.cache` to have share one instance.

```js
const { Unleash } = require('unleash-client');

const unleash = new Unleash({
  appName: 'my-app-name',
  url: 'http://unleash.herokuapp.com',
  customHeaders: {
    Authorization: 'API token',
  },
});

unleash.on('ready', console.log.bind(console, 'ready'));
// required error handling when using unleash directly
unleash.on('error', console.error);
```

## Events

The unleash instance object implements the EventEmitter class and **emits** the following events:

| event        | payload                          | description                                                                                                                                                                                                                                  |
| ------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ready        | -                                | is emitted once the fs-cache is ready. if no cache file exists it will still be emitted. The client is ready to use, but might not have synchronized with the Unleash API yet. This means the SDK still can operate on stale configurations. |
| synchronized | -                                | is emitted when the SDK has successfully synchronized with the Unleash API and has all the latest feature toggle configuration available.                                                                                                    |
| registered   | -                                | is emitted after the app has been registered at the api server                                                                                                                                                                               |
| sent         | `object` data                    | key/value pair of delivered metrics                                                                                                                                                                                                          |
| count        | `string` name, `boolean` enabled | is emitted when a feature is evaluated                                                                                                                                                                                                       |
| warn         | `string` msg                     | is emitted on a warning                                                                                                                                                                                                                      |
| error        | `Error` err                      | is emitted on a error                                                                                                                                                                                                                        |
| unchanged    | -                                | is emitted each time the client gets new toggle state from server, but nothing has changed                                                                                                                                                   |
| changed      | `object` data                    | is emitted each time the client gets new toggle state from server and changes has been made                                                                                                                                                  |
|              |

Example usage:

```js
const { initialize } = require('unleash-client');

const unleash = initialize({
    appName: 'my-app-name',
    url: 'http://unleash.herokuapp.com/api/',
    customHeaders: {
    Authorization: 'API token',
  },
});

// Some useful life-cycle events
unleash.on('ready', console.log);
unleash.on('synchronized', console.log);
unleash.on('error', console.error);
unleash.on('warn', console.warn);

unleash.once('registered', () => {
    // Do something after the client has registered with the server api.
    // NB! It might not have received updated feature toggles yet.
});

unleash.once('changed', () => {
    console.log(`Demo is enabled: ${unleash.isEnabled('Demo')}`);
});

unleash.on('count', (name, enabled) => console.log(`isEnabled(${name}`)
```

## Toggle definitions

Sometimes you might be interested in the raw feature toggle definitions.

```js
const {
  initialize,
  getFeatureToggleDefinition,
  getFeatureToggleDefinitions,
} = require('unleash-client');

initialize({
  url: 'http://unleash.herokuapp.com/api/',
  customHeaders: {
    Authorization: 'API token',
  },
  appName: 'my-app-name',
  instanceId: 'my-unique-instance-id',
});

const featureToogleX = getFeatureToggleDefinition('app.ToggleX');
const featureToggles = getFeatureToggleDefinitions();
```

## Custom repository

You can manage the underlying data layer yourself if you want to. This enables you to use unleash
offline, from a browser environment or implement your own caching layer. See
[example](examples/custom_repository.js).

Unleash depends on a `ready` event of the repository you pass in. Be sure that you emit the event
**after** you've initialized unleash.
