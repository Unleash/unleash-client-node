# Changelog

## 3.2.5

-   feature: Allow user to implement custom toggle repository
-   feat: Drop node 6 support (EOL)
-   feat: Get all feature toggle definitions at once
-   fix: Update lint-staged to the latest version 8.1.7
-   fix: Update nock to version 10.0.6
-   fix: Update @types/node to version 12.0.2
-   fix: Update husky to version 2.3.0
-   fix: Update ava to version 1.4.1
-   fix: Update eslint to version 5.16.0
-   fix: Update nyc to version 14.1.1

## 3.2.4

-   feat: add timeout option for http requests (#115)
-   fix: Upgrade husky to version 2.2.0
-   fix: Update lint-staged to the latest version 🚀 (#112)
-   fix: Update @types/node to the latest version 🚀 (#113)
-   fix: Update @types/nock to the latest version 🚀 (#111)
-   chore: update deails.json

## 3.2.3

-   fix: details.json should be updated after npm version

## 3.2.2

-   fix: remove pkginfo dependency.

## 3.2.1

-   fix: typo in variant metrics making them not show up

## 3.2.0

-   feat: Add support for toggle variants

## 3.1.2

-   fix(GradualRolloutStrategy): percentage=0 should mean disabled

## 3.1.1

-   Updated request.js to version 2.88.0

## 3.1.0

-   Add method to get the featureToggle definition
-   Expose count method to extensions in unleash client

## 3.0.0

-   You will have to use `unleash-server` v3 in order to use v3 of the client.
-   Swhich hashing to MurmurHash (https://github.com/Unleash/unleash/issues/247)
-   Bugfix RemoteAddressStrategy (https://github.com/Unleash/unleash-client-node/issues/65)
-   Update client paths for v3 (https://github.com/Unleash/unleash-client-node/issues/50)

## 2.3.1

-   Add sdkVersion in client register call
    (https://github.com/Unleash/unleash-client-node/issues/49)
-   IP range support to remoteAddress-strategy
    (https://github.com/Unleash/unleash-client-node/pull/58)

*   Update API endoint paths for Unleash 3.x
    (https://github.com/Unleash/unleash-client-node/issues/50)

## 2.3.0

-   Add support for custom headers

## 2.2.1

-   Fix broken metrics reporting

## 2.2.0

-   Add user-agent header to requests
-   Add appName and instanceId as headers to post requests

## 2.1.3

-   Bugfix: Must export Strategy interface to allow custom implementations.

## 2.1.2

-   Unleash should not throw if os.userInfo throws #35

## 2.1.1 (March 2017)

-   allow appName to contain "/" when storing file backup

## 2.1.0 (February 2017)

-   Provide implementations of pre-defined activation strategies.
    -   applicationHostname
    -   gradualRolloutRandom
    -   gradualRolloutSessionId
    -   gradualRolloutUserId
    -   remoteAddress
    -   userWithId

## 1.0.0 (January 2017)

-   Support multiple strategies. This makes it easy to use multiple activation strategies in
    combination.
-   Client metrics. Gives details about what toggles a specific client application uses, how many
    times a toggle was evaluated to true / false.
-   Client registration.

## 0.0.1 (January 2015)

-   Initial public release
