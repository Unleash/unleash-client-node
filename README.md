# unleash-client-node
This is the node client for Unleash. Read more about the [Unleash project](https://github.com/finn-no/unleash)

## Getting started

### 1. Initialize unleash-client
You should as early as possible in your node (web) app initialize the
unleash-client.  The unleash-client will set-up a in-memory repository,
and poll updates from the unleash-server at regular intervals.
```
var unleash = require('unleash-client-node');
unleash.initialize({url: 'http://unleash.herokuapp.com/features'});
```

### 2. Use unleash
After you have initialized the unleash-client you can easily check if a feature
toggle is enabled or not.

```
var unleash = require('unleash-client-node');
unleash.isEnabled("app.ToggleX");
```

### 3. Stop unleash
To shut down the client (turn off the polling) you can simply call the
destroy-method. This is typically not required.

```
unleash.destroy()
```




## Advanced usage
The initialize method takes the following arguments:

- **url** - the url to fetch toggles from. (required)
- **refreshIntervall** - The poll-intervall to check for updates. Defaults to 15s.
- **Strategies** - Custom activation strategies to be used.

## Custom strategies

### 1. implement the custom strategy:
```
var unleash = require('unleash-client-node');
function ActiveForUserWithEmailStrategy() {
    this.name = 'ActiveForUserWithEmail';
}

util.inherits(ActiveForUserWithEmailStrategy, unleash.Strategy);

ActiveForUserWithEmailStrategy.prototype.isEnabled = function(parameters, context) {
    return parameters.emails.indexOf(context.email) !== -1;
};
```

### 2. register your custom strategy:

```
unleash.initialize({
    url: 'http://unleash.herokuapp.com/features',
    strategies: [new ActiveForUserWithEmailStrategy()]
});
```
