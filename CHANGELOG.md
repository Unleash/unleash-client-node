# Changelog

# 3.15.0
- feat: add impression events (#336)
- fix: string operator needs to guard against non-string values (#343)
- fix(deps): update dependency make-fetch-happen to v10 (#300)
- fix: NOT_IN operator for missing contextField should return true. (#340)
- fix: Use fallback value if not initialised (#339)
- chore(deps): update dependency @types/node to v14.18.21 (#341)
- chore(deps): update dependency @typescript-eslint/eslint-plugin to v5.29.0 (#294)
- chore(deps): update dependency eslint-plugin-import to v2.26.0 (#322)
- chore(deps): update dependency @types/semver to v7.3.10 (#342)
- chore(deps): update dependency eslint to v8.18.0 (#298)
- chore(deps): update dependency prettier to v2.7.1 (#323)
- chore(deps): update dependency typescript to v4.7.4 (#324)
- chore(deps): update actions/checkout action to v3 (#325)
- chore(deps): update actions/setup-node action to v3 (#326)

# 3.14.1
- feat: pass spec header so global segments can be toggled (#335)
- chore: Update build-details
- chore: Update build-details

# 3.14.0
- feat: Added agent to the HttpOptions (#332)
- feat: Add support for handling global segments (#329)
- fix: force semver operators to resolve to false against non strict semver (#333)
- fix: Type is missing from FeatureInterface used by getFeatureDefinitions and more (#328)
- docs: fix example usage in readme (#330)
- meta: add external PRs to project board
- meta: add 'new items to project board' workflow
- chore: upgrade unleash client spec to 4.2.0
- chore: Update build-details

# 3.13.4
- fix: Cannot read property 'split' of undefined in UserWithIdStrategy (#311)
- fix: Use string[] instead of String[] for Override values (#320)
- docs: Add remaining change requests from #318 (#319)
- docs: Clearer client alternative usage and highlight the require use of error handling (#318)
- chore(deps): update dependency @types/node to v14.18.16 (#321)
- chore(deps): update dependency sinon to v13 (#299)
- chore(deps): update dependency lint-staged to v12.4.1 (#295)
- chore(deps): update dependency nock to v13.2.4 (#301)
- chore(deps): update dependency @types/make-fetch-happen to v9.0.2 (#312)
- chore(deps): update dependency eslint-config-prettier to v8.5.0 (#317)
- chore(deps): pin dependencies (#306)
- chore(deps): update dependency redis to v4.0.6 (#314)
- chore: correct changelog
- chore: Update build-details
# 3.13.3
- fix: getVariant should also count usage

# 3.13.2
- fix: remove unused dependency nodemon (#315)

# 3.12.0
- feat: add support for new constraint operators (#289)
# 3.11.3
- fix: should handle empty backups (#303)
# 3.11.2
- fix: ready should not be emitted if local backup is empty
# 3.11.1
- fix: add impression data property to feature configuration (#293)
# 3.11.0

- feat: add bootstrap capability (#283)
- fix: Update prs.yaml (#248)
- fix: require json-schema 0.4.0 or higher
- fix: remove package-lock.json (we are using yarn.lock)
- chore(deps): update dependency lint-staged to v12.3.1 (#281)
- build(deps): bump trim-off-newlines from 1.0.1 to 1.0.3 (#291)
- chore(deps): update dependency @types/node to v14.18.9
- chore(deps): update dependency eslint to v8.7.0
- chore(deps): update dependency @typescript-eslint/eslint-plugin to v5.10.0 (#277)
- chore(deps): update dependency eslint-plugin-import to v2.25.4 (#285)
- chore(deps): update dependency nock to v13.2.2 (#287)
- chore(deps): update dependency typescript to v4.5.5 (#288)
- chore(deps): pin dependency redis to 4.0.2 (#290)
- chore(workflows): update with new branch names (#280)
- chore(deps): update dependency eslint to v8.5.0 (#275)
- chore(deps): update dependency lint-staged to v12.1.3 (#276)
- chore(deps): update dependency @types/node to v14.18.2 (#278)
- chore(deps): update dependency @types/node to v14.18.1 (#274)
- chore(deps): update dependency eslint to v8 (#267)
- chore(deps): update dependency @typescript-eslint/eslint-plugin to v5 (#266)
- chore(deps): update dependency eslint-config-airbnb-base to v15 (#268)
- chore(deps): update dependency eslint-plugin-prettier to v4 (#270)
- chore(deps): update dependency @typescript-eslint/eslint-plugin to v4.33.0 (#259)
- chore(deps): update dependency typescript to v4.5.4 (#273)
- chore(deps): update dependency typescript to v4.5.3 (#255)
- chore(deps): update dependency lint-staged to v12 (#271)
- chore(deps): update metcalfc/changelog-generator action to v3 (#272)
- chore(deps): update dependency @types/node to v14.18.0 (#258)
- chore(deps): update dependency eslint-plugin-import to v2.25.3 (#260)
- chore(deps): update dependency lint-staged to v11.2.6 (#261)
- chore(deps): update actions/setup-node action to v2 (#263)
- chore(deps): update dependency prettier to v2.5.1 (#262)
- chore(deps): update c-hive/gha-yarn-cache action to v2 (#264)
- chore(deps): update dependency husky to v7.0.4 (#257)
- chore(deps): update dependency eslint-plugin-prettier to v3.4.1 (#256)
- chore(deps): update dependency nock to v13.2.1 (#253)
- chore(deps): update dependency sinon to v12 (#254)
- chore(deps): update dependency @types/make-fetch-happen to v9.0.1 (#250)
- chore(deps): pin dependencies (#249)
- chore(deps): add renovate.json (#242)

# 3.10.1

- fix: expose TagFilter enum

# 3.10.0

- feat: Add support to provide namePrefix and tags for filtering (#237)
- fix: cleanup tag interface
- fix: Changed the priority of the strategy block (#235)
- fix: bump eslint-config-prettier to 8.3.0
- fix: upgrade sinon to 11.1.2
- fix: run tests all node.js > 12
- fix: upgrade husky to 7.0.1
- fix: bump lint staged to 11.1.2
- fix: bump @types/node to 14.17.9
- fix: upgrade @ava/babel to 2.0.0
- fix: failing test
- fix: update yarn.lock
- fix: bump make-fetch-happen to version 9.0.4

# 3.9.0

- fix: add support for passing in rejectUnauthorized to http fetch (#229)

# 3.8.1

- Fix: (types) relax argument requirements (#223)

# 3.8.0

- feat: use make-fetch-happen instead of node-fetch (#217)

# 3.7.1

- fix: Handle trailing slash or not in base url (#214)

# 3.7.0

- feat: variant stickiness (#202)
- feat: add "synchronized" event (#212)
- feat: add query support (#211)

# 3.6.0

- feat: flexible rollout - custom stickiness (#201)
- fix: add another test-script
- fix: add test for variants validation
- fix: Keep fetching if customHeadersFunction fails. (#210)
- fix: emit warn if initialize is called multiple times
- fix tests for node 10
- fix: add meta to test-script

# 3.5.0

- fix: Replace deprecated request library with node-fetch
- chore: upgrade typescript to 4.1.3
- chore: upgrade sinon to 9.2.4
- chore: upgrade eslint to 7.19.0
- chore: migrate to eslint-config-airbnb
- chore: upgrade nock to 13.0.7
- chore: upgrade ava to 3.15.0
- chore: adopt eslint-config-airbnb-typescript

# 3.4.0

- fix: Only unref timers when used in node, where unref is defined (#188)
- feat: Expose Context and Variant interfaces (#190)
- fix: Typo in Properties interface name (#189)
- feat: Add stale property to the FeatureInterface (#185)
- chore: correct example in README.
- chore: Update build-details

# 3.3.6

- fix: upgrade request to version 2.88.2
- fix: add keepAlive options to request.

# 3.3.5

- Fix typo (#174)
- fix: varant should support all context fields (#178)
- Update @types/node to the latest version 🚀 (#175)
- Merge pull request #176 from aBMania/patch-1
- fix typo in readme
- fix: license year and company

# 3.3.4

- chore: upgrade typscrip to version 3.8.2
- chore: Update nock to the latest version
- chore: Update sinon to the latest version
- chore(package): update lint-staged to version 10.0.3

## 3.3.3

- fix: clean up properties types a bit

## 3.3.2

- feat: add events for changed and unchanged repository
- fix: upgrade @types/node to verison 12.12.25
- fix: upgrade typescript to version 3.7.5
- fix: upgrade husky to version 4.2.1
- fix: upgrade sinon to version 8.1.1
- fix: upgrade prettier to verseion 1.19.1
- fix: upgrade nock to version 11.7.2
- fix: upgrade dependencies
- fix: remove package-lock.json
- fix: upgrade sinon to version 8.1.1
- fix: upgrade prettier to verseion 1.19.1
- fix: upgrade nock to version 11.7.2
- fix: upgrade dependencies
- fix: remove package-lock.json

## 3.3.1

- fix: ensure destroy works more consistently (#153)

## 3.3.0

- feat: Add support for fallback function (#150)
- feat: customHeaderFunction to dynamic setting headers (#152)
- fix: upgrade @unleash/client-specification to version 3.3.0

## 3.2.9

- fix: clean up strategy tests
- fix: Missing context field should not crash constraints.
- fix: bump eslint-utils from 1.3.1 to 1.4.2 (#147)
- fix: Update cross-env to the latest version 🚀 (#145)

## 3.2.8

- fix: script for updating client version

## 3.2.7

- fix: upgrade ava to version 2.2.0
- fix: upgrade husky to version 3.0.1
- fix: upgrade eslint to version 6.1.0
- fix: upgrade lint-staged to version 9.2.1
- feat: Add support for static context fields (#136)
- feat: add support for strategy constraint (beta)
- feat: add support for flexible-rollout-strategy

## 3.2.6

- fix: update README init param defaults to milliseconds (#126)
- fix: bump js-yaml from 3.12.0 to 3.13.1 (#129)
- fix: Strategy gradualRolloutRandom random should <= 100 (#132)
- chore: Update readme - appName is required (#130)
- chore: control gradual rollout strategy randomness (#133)

## 3.2.5

- feature: Allow user to implement custom toggle repository
- feat: Drop node 6 support (EOL)
- feat: Get all feature toggle definitions at once
- fix: Update lint-staged to the latest version 8.1.7
- fix: Update nock to version 10.0.6
- fix: Update @types/node to version 12.0.2
- fix: Update husky to version 2.3.0
- fix: Update ava to version 1.4.1
- fix: Update eslint to version 5.16.0
- fix: Update nyc to version 14.1.1

## 3.2.4

- feat: add timeout option for http requests (#115)
- fix: Upgrade husky to version 2.2.0
- fix: Update lint-staged to the latest version 🚀 (#112)
- fix: Update @types/node to the latest version 🚀 (#113)
- fix: Update @types/nock to the latest version 🚀 (#111)
- chore: update deails.json

## 3.2.3

- fix: details.json should be updated after npm version

## 3.2.2

- fix: remove pkginfo dependency.

## 3.2.1

- fix: typo in variant metrics making them not show up

## 3.2.0

- feat: Add support for toggle variants

## 3.1.2

- fix(GradualRolloutStrategy): percentage=0 should mean disabled

## 3.1.1

- Updated request.js to version 2.88.0

## 3.1.0

- Add method to get the featureToggle definition
- Expose count method to extensions in unleash client

## 3.0.0

- You will have to use `unleash-server` v3 in order to use v3 of the client.
- Swhich hashing to MurmurHash (https://github.com/Unleash/unleash/issues/247)
- Bugfix RemoteAddressStrategy (https://github.com/Unleash/unleash-client-node/issues/65)
- Update client paths for v3 (https://github.com/Unleash/unleash-client-node/issues/50)

## 2.3.1

- Add sdkVersion in client register call (https://github.com/Unleash/unleash-client-node/issues/49)
- IP range support to remoteAddress-strategy
  (https://github.com/Unleash/unleash-client-node/pull/58)

* Update API endoint paths for Unleash 3.x
  (https://github.com/Unleash/unleash-client-node/issues/50)

## 2.3.0

- Add support for custom headers

## 2.2.1

- Fix broken metrics reporting

## 2.2.0

- Add user-agent header to requests
- Add appName and instanceId as headers to post requests

## 2.1.3

- Bugfix: Must export Strategy interface to allow custom implementations.

## 2.1.2

- Unleash should not throw if os.userInfo throws #35

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

- Support multiple strategies. This makes it easy to use multiple activation strategies in
  combination.
- Client metrics. Gives details about what toggles a specific client application uses, how many
  times a toggle was evaluated to true / false.
- Client registration.

## 0.0.1 (January 2015)

- Initial public release
