# Changelog

## 2.1.1 (March 2017)
- allow appName to contain "/" when storing file backup

## 2.1.0 (February 2017)
- Provide implementations of pre-defined activation strategies.
    - applicationHostname
    - gradualRolloutRandom
    - gradualRolloutSessionId
    - gradualRolloutUserId
    - remoteAddress
    - userWithId
    

## 1.0.0 (January 2017)

- Support multiple strategies. This makes it easy to use multiple activation strategies in combination.
- Client metrics. Gives details about what toggles a specific client application uses, how many times a toggle was evaluated to true / false. 
- Client registration.

## 0.0.1 (January 2015)
- Initial public release

