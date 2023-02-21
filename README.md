# Unleash Client SDK for Node.js

[![Unleash node SDK on npm](https://img.shields.io/npm/v/unleash-client)](https://www.npmjs.com/package/unleash-client)
![npm downloads](https://img.shields.io/npm/dm/unleash-client)
[![Build Status](https://github.com/Unleash/unleash-client-node/workflows/Build/badge.svg)](https://github.com/Unleash/unleash-client-node/actions)
[![Code Climate](https://codeclimate.com/github/Unleash/unleash-client-node/badges/gpa.svg)](https://codeclimate.com/github/Unleash/unleash-client-node)
[![Coverage Status](https://coveralls.io/repos/github/Unleash/unleash-client-node/badge.svg?branch=main)](https://coveralls.io/github/Unleash/unleash-client-node?branch=main)

The official Unleash client SDK for Node.js.

## Getting started

### 1. Install the unleash-client into your project

```bash
npm install unleash-client
```

or

```bash
yarn add unleash-client
```

(Or any other tool you like.)

### 2. Initialize unleash-client

Once installed, you must initialize the SDK in your application. By default, Unleash initialization
is asynchronous, but if you need it to be synchronous, you can
[block until the SDK has synchronized with the server](#synchronous-initialization).

Note that until the SDK has synchronized with the API, all features will evaluate to `false` unless
you a [bootstrapped configuration](#bootstrap).

---

💡 **Tip**: All code samples in this section will initialize the SDK and try to connect to the
Unleash instance you point it to. You will need an Unleash instance and a
[server-side API token](https://docs.getunleash.io/reference/api-tokens-and-client-keys#client-tokens)
for the connection to be successful.

---

We recommend that you initialize the Unleash client SDK **as early as possible** in your
application. The SDK will set up an in-memory repository and poll for updates from the Unleash
server at regular intervals.

```js
const { initialize } = require('unleash-client');

const unleash = initialize({
  url: 'https://YOUR-API-URL',
  appName: 'my-node-name',
  customHeaders: { Authorization: 'SOME-SECRET' },
});
```

The `initialize` function will configure a **global** Unleash instance. If you call this method
multiple times, the global instance will be changed. You will **not** create multiple instances.

#### How do I know when it's ready?

Because the SDK takes care of talking to the server in the background, it can be difficult to know
exactly when it has connected and is ready to evaluate toggles. If you want to run some code when
the SDK becomes ready, you can listen for the `'synchronized'` event:

```js
unleash.on('synchronized', () => {
  // the SDK has synchronized with the server
  // and is ready to serve
});
```

Refer to the [events reference](#events) later in this document for more information on events and
an exhaustive list of all the events the SDK can emit.

The `initialize` function will configure and create a _global_ Unleash instance. When a global instance exists, calling this method has no effect. Call the `destroy` function to remove the globally configured instance.

#### Constructing the Unleash client directly

You can also construct the Unleash instance yourself instead of via the `initialize` method.

When using the Unleash client directly, you **should not create new Unleash instances on every request**. Most applications are expected to only have a single Unleash instance (singleton). Each Unleash instance will maintain a connection to the Unleash API, which may result in flooding the Unleash API. 

```js
const { Unleash } = require('unleash-client');

const unleash = new Unleash({
  url: 'https://YOUR-API-URL',
  appName: 'my-node-name',
  customHeaders: { Authorization: 'SOME-SECRET' },
});

unleash.on('ready', console.log.bind(console, 'ready'));

// optional error handling when using unleash directly
unleash.on('error', console.error);
```

#### Synchronous initialization

You can also use the `startUnleash` function and `await` to wait for the SDK to have fully
synchronized with the Unleash API. This guarantees that the SDK is not operating on local and
potentially stale feature toggle configuration.

```js
const { startUnleash } = require('unleash-client');

const unleash = await startUnleash({
  url: 'https://YOUR-API-URL',
  appName: 'my-node-name',
  customHeaders: { Authorization: 'SOME-SECRET' },
});

// Unleash SDK has now fresh state from the unleash-api
const isEnabled = unleash.isEnabled('Demo');
```

### 3. Check features

With the SDK initialized, you can use it to check the states of your feature toggles in your
application.

The primary way to check feature toggle status is to use the `isEnabled` method on the SDK. It takes
the name of the feature and returns `true` or `false` based on whether the feature is enabled or
not.

```javascript
setInterval(() => {
  if (unleash.isEnabled('DemoToggle')) {
    console.log('Toggle enabled');
  } else {
    console.log('Toggle disabled');
  }
}, 1000);
```

👀 **Note**: In this example, we've wrapped the `isEnabled` call inside a `setInterval` function. In
the event that all your app does is to start the SDK and check a feature status, this is will keep a
node app running until the SDK has synchronized with the Unleash API. It is **not** required in
normal apps.

#### Providing an Unleash context

Calling the `isEnabled` method with just a feature name will work in simple use cases, but in many
cases you'll also want to provide an
[Unleash context](https://docs.getunleash.io/reference/unleash-context). The SDK uses the Unleash
context to evaluate any
[activation strategy](https://docs.getunleash.io/reference/activation-strategies) with
[strategy constraints](https://docs.getunleash.io/reference/strategy-constraints), and also to
evaluate some of the built-in strategies.

The `isEnabled` accepts an Unleash context object as a second argument:

```js
const unleashContext = {
  userId: '123',
  sessionId: 'some-session-id',
  remoteAddress: '127.0.0.1',
  properties: {
    region: 'EMEA',
  },
};

const enabled = unleash.isEnabled('someToggle', unleashContext);
```

### 4. Stop unleash

To shut down the client (turn off the polling) you can simply call the destroy-method. This is
typically not required.

```js
const { destroy } = require('unleash-client');
destroy();
```

### Built in activation strategies

The client comes supports all built-in activation strategies provided by Unleash.

Read more about
[activation strategies in the official docs](https://docs.getunleash.io/reference/activation-strategies).

### Unleash context

In order to use some of the common activation strategies you must provide an
[Unleash context](https://docs.getunleash.io/reference/unleash-context). This client SDK allows you
to send in the unleash context as part of the `isEnabled` call:

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
- **environment** - The value to put in the Unleash context's `environment` property. Automatically
  populated in the Unleash Context (optional). This does **not** set the SDK's
  [Unleash environment](https://docs.getunleash.io/reference/environments).
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
- **tags** - Only fetch feature toggles tagged with the list of tags. E.g.:
  `[{type: 'simple', value: 'proxy'}]`.

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
| impression   | `object` data                    | is emitted for every user impression (isEnabled / getVariant)                                                                                                                                                                                |

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

The Node.js SDK supports a bootstrap parameter, allowing you to load the initial feature toggle
configuration from somewhere else than the Unleash API. The bootstrap `data` can be provided as an
argument directly to the SDK, as a `filePath` to load or as a `url` to fetch the content from.
Bootstrap is a convenient way to increase resilience, where the SDK can still load fresh toggle
configuration from the bootstrap location, even if the Unleash API should be unavailable at startup.

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
    ],
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
    },
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

By default this SDK will use a store provider that writes a backup of the feature toggle
configuration to a **file on disk**. This happens every time it receives updated configuration from
the Unleash API. You can swap out the store provider with either the provided in-memory store
provider or a custom store provider implemented by you.

**1. Use InMemStorageProvider**

```js
const { initialize, InMemStorageProvider } = require('unleash-client');

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
const { initialize, InMemStorageProvider } = require('unleash-client');

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
