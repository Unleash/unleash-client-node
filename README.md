# Unleash Client SDK for Node.js

![npm](https://img.shields.io/npm/v/unleash-client)
![npm](https://img.shields.io/npm/dm/unleash-client)
[![Build Status](https://github.com/Unleash/unleash-client-node/workflows/Build/badge.svg)](https://github.com/Unleash/unleash-client-node/actions)
[![Code Climate](https://codeclimate.com/github/Unleash/unleash-client-node/badges/gpa.svg)](https://codeclimate.com/github/Unleash/unleash-client-node)
[![Coverage Status](https://coveralls.io/repos/github/Unleash/unleash-client-node/badge.svg?branch=main)](https://coveralls.io/github/Unleash/unleash-client-node?branch=main)

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
Be aware that the `initialize` function will configure a _global_ Unleash instance. If you call this method multiple times the global instance will be changed.

#### Constructing the Unleash client directly

You can also construct the Unleash instance yourself instead of via the `initialize` method.

**Important:** When using the Unleash client directly, you **must** handle errors yourself. Do this by attaching an event listener to the `error` event, as shown in the example below. If you don't do this, your application may crash either on startup or at runtime if it can't reach the Unleash server or if it encounters other errors.

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
[activation-strategy.md](https://github.com/Unleash/unleash/blob/main/docs/activation-strategies.md).

### Unleash context

In order to use some of the common activation strategies you must provide a
[unleash-context](https://github.com/Unleash/unleash/blob/main/docs/unleash-context.md). This
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

- **url** - The url to fetch toggles from (required).
- **appName** - The application name / codebase name (required).
- **environment** - The active environment this application is running in. Automatically populated in the Unleash Context (optional).
- **instanceId** - A unique identifier, should/could be somewhat unique.
- **refreshInterval** - The poll interval to check for updates. Defaults to 15000ms.
- **metricsInterval** - How often the client should send metrics to Unleash API. Defaults to
  60000ms.
- **strategies** - Custom activation strategies to be used.
- **disableMetrics** - Disable metrics.
- **customHeaders** - Provide a map(object) of custom headers to be sent to the unleash-server.
- **customHeadersFunction** - Provide a function that return a Promise resolving as custom headers
  to be sent to unleash-server. When options are set, this will take precedence over `customHeaders`
  option.
- **timeout** - Specify a timeout in milliseconds for outgoing HTTP requests. Defaults to 10000ms.
- **repository** - Provide a custom repository implementation to manage the underlying data.
- **httpOptions** - Provide custom http options such as `rejectUnauthorized` - be careful with these
  options as they may compromise your application security.
- **namePrefix** - Only fetch feature toggles with the provided name prefix.
- **tags** - Only fetch feature toggles tagged with the list of tags. E.g.: `[{type: 'simple', value: 'proxy'}]`.

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

## Events

The unleash instance object implements the EventEmitter class and **emits** the following events:

| event        | payload                          | description                                                                                                                                                                                                                                  |
| ------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ready        | -                                | is emitted once the fs-cache is ready. if no cache file exists it will still be emitted. The client is ready to use, but might not have synchronized with the Unleash API yet. This means the SDK still can operate on stale configurations. |
| synchronized | -                                | is emitted when the SDK has successfully synchronized with the Unleash API, or when it has been bootstrapped, and has all the latest feature toggle configuration available.                                                                 |
| registered   | -                                | is emitted after the app has been registered at the api server                                                                                                                                                                               |
| sent         | `object` data                    | key/value pair of delivered metrics                                                                                                                                                                                                          |
| count        | `string` name, `boolean` enabled | is emitted when a feature is evaluated                                                                                                                                                                                                       |
| warn         | `string` msg                     | is emitted on a warning                                                                                                                                                                                                                      |
| error        | `Error` err                      | is emitted on a error                                                                                                                                                                                                                        |
| unchanged    | -                                | is emitted each time the client gets new toggle state from server, but nothing has changed                                                                                                                                                   |
| changed      | `object` data                    | is emitted each time the client gets new toggle state from server and changes has been made                                                                                                                                                  |
| impression   | `object` data                    | is emitted for every user impression (isEnabled / getVariant)                                                                                                                                                                               |

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

unleash.on('count', (name, enabled) => console.log(`isEnabled(${name})`));
```

## Bootstrap

(Available from v3.11.x)

The Node.js SDK supports a bootstrap parameter, allowing you to load the initial feature toggle configuration from somewhere else than the Unleash API. The bootstrap `data` can be provided as an argument directly to the SDK, as a `filePath` to load or as a `url` to fetch the content from. Bootstrap is a convenient way to increase resilience, where the SDK can still load fresh toggle configuration from the bootstrap location, even if the Unleash API should be unavailable at startup.

**1. Bootstrap with data passed as an argument**

```js
const client = initialize({
  appName: 'my-application',
  url: 'https://app.unleash-hosted2.com/demo/api/',
  customHeaders: {
    Authorization: '943ca9171e2c884c545c5d82417a655fb77cec970cc3b78a8ff87f4406b495d0',
  },
  bootstrap: {
    data: [
      {
        enabled: false,
        name: 'BootstrapDemo',
        description: '',
        project: 'default',
        stale: false,
        type: 'release',
        variants: [],
        strategies: [{ name: 'default' }],
      },
    ]
  },
});

```


**2. Bootstrap via a URL**

```js
const client = initialize({
  appName: 'my-application',
  url: 'https://app.unleash-hosted.com/demo/api/',
  customHeaders: {
    Authorization: '943ca9171e2c884c545c5d82417a655fb77cec970cc3b78a8ff87f4406b495d0',
  },
  bootstrap: {
    url: 'http://localhost:3000/proxy/client/features',
    urlHeaders: {
    Authorization: 'bootstrap',
   }
  },
});

```

**3. Bootstrap from a File**

```js
const client = initialize({
  appName: 'my-application',
  url: 'https://app.unleash-hosted.com/demo/api/',
  customHeaders: {
    Authorization: '943ca9171e2c884c545c5d82417a655fb77cec970cc3b78a8ff87f4406b495d0',
  },
  bootstrap: {
   filePath: '/tmp/some-bootstrap.json',
  },
});

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

const featureToggleX = getFeatureToggleDefinition('app.ToggleX');
const featureToggles = getFeatureToggleDefinitions();
```

## Custom Store Provider

(Available from v3.11.x)

By default this SDK will use a store provider that writes a backup of the feature toggle configuration to a **file on disk**. This happens every time it receives updated configuration from the Unleash API. You can swap out the store provider with either the provided in-memory store provider or a custom store provider implemented by you.

**1. Use InMemStorageProvider**

```js
const {
  initialize,
  InMemStorageProvider,
} = require('unleash-client');

const client = initialize({
  appName: 'my-application',
  url: 'http://localhost:3000/api/',
  customHeaders: {
    Authorization: 'my-key',
  },
  storageProvider: new InMemStorageProvider(),
});
```

**2. Custom Store Provider backed by redis**

```js
const {
  initialize,
  InMemStorageProvider,
} = require('unleash-client');

const { createClient } = require('redis');

class CustomRedisStore {
  async set(key, data) {
    const client = createClient();
    await client.connect();
    await client.set(key, JSON.stringify(data));

  }
  async get(key) {
    const client = createClient();
    await client.connect();
    const data = await client.get(key);
    return JSON.parse(data);
  }
}

const client = initialize({
  appName: 'my-application',
  url: 'http://localhost:3000/api/',
  customHeaders: {
    Authorization: 'my-key',
  },
  storageProvider: new CustomRedisStore(),
});
```


## Custom repository

You can manage the underlying data layer yourself if you want to. This enables you to use unleash
offline, from a browser environment or implement your own caching layer. See
[example](examples/custom_repository.js).

Unleash depends on a `ready` event of the repository you pass in. Be sure that you emit the event
**after** you've initialized unleash.
