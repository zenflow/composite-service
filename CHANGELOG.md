# Changelog

# [1.0.0](https://github.com/zenflow/composite-service/compare/v0.12.0...v1.0.0) (2021-05-04)

*No changes*

# [0.12.0](https://github.com/zenflow/composite-service/compare/v0.11.1...v0.12.0) (2021-05-04)


### Features

* Error when service dependency has no `ready` config, closes [#35](https://github.com/zenflow/composite-service/issues/35) ([2819396](https://github.com/zenflow/composite-service/commit/2819396dc4135ebc6a8156cab28516e541da2f68))

## [0.11.1](https://github.com/zenflow/composite-service/compare/v0.11.0...v0.11.1) (2021-03-28)


### Bug Fixes

* onceHttpOk should be a property of ReadyContext, not a method ([cc52499](https://github.com/zenflow/composite-service/commit/cc524992faa6fb1c5d78aa9a14bf028256116220))

# [0.11.0](https://github.com/zenflow/composite-service/compare/v0.10.1...v0.11.0) (2021-03-28)


### Features

* add `onceHttpOk` helper to `ReadyContext` ([35494c1](https://github.com/zenflow/composite-service/commit/35494c169b4139224d9f0387907da81bf74224b2))
* stringify errors for console output using `util.inspect()` ([94640ac](https://github.com/zenflow/composite-service/commit/94640acfef9b8a0f7614f9aa6ff47c55065c3b6d))

## [0.10.1](https://github.com/zenflow/composite-service/compare/v0.10.0...v0.10.1) (2021-03-20)


### Bug Fixes

* sync error in onceOutputLine callback should cause async rejection ([ac860ac](https://github.com/zenflow/composite-service/commit/ac860ac099907eb4927d1f5d8dd618098fcbcbfc))

# [0.10.0](https://github.com/zenflow/composite-service/compare/v0.9.0...v0.10.0) (2021-03-18)


### Bug Fixes

* Define proper return types for `ready` & `onCrash` ([f0937df](https://github.com/zenflow/composite-service/commit/f0937dfc261cc5013d59ca70b1a0646a56b4416e))


### Features

* add OnCrashContext.serviceId ([a3c8857](https://github.com/zenflow/composite-service/commit/a3c8857e901c042b9783e66a1e0b6d602abd00c8))
* Add ServiceConfig.crashesLength property, default to 0 ([fe7e861](https://github.com/zenflow/composite-service/commit/fe7e86132b37eec73be872dadcebdbef40dfe182))
* Default `minimumRestartDelay` is 0 ([e449d68](https://github.com/zenflow/composite-service/commit/e449d68f9039308a07f66e512f4704c6412d7e23))
* Implement smart default onCrash ([5dd2d20](https://github.com/zenflow/composite-service/commit/5dd2d20ccb05ee31ece1351c9c6000794eb6ee2e))
* Nicer console message reporting error in `ready` or `onCrash` ([5788792](https://github.com/zenflow/composite-service/commit/5788792800a7ebefe39c3402e65a2255342d6f80))
* Provide "ready helpers" as ReadyContext methods ([cebd1a9](https://github.com/zenflow/composite-service/commit/cebd1a954ae7ae2ca8f8c82a4a274fa2586892cd))
* Start child processes safely using 'spawn' event where supported ([bc1ad0e](https://github.com/zenflow/composite-service/commit/bc1ad0ee9ccde11aba5d152ab3600be90c0cdced))
* Strings that are "console output lines" do not need trailing "\n" ([ab92ff8](https://github.com/zenflow/composite-service/commit/ab92ff846ecacb9ed0d456b3b4df205b2704b718))

# [0.9.0](https://github.com/zenflow/composite-service/compare/v0.8.0...v0.9.0) (2021-03-15)


### Bug Fixes

* Remove terminal colors, closes [#28](https://github.com/zenflow/composite-service/issues/28) ([90e98bb](https://github.com/zenflow/composite-service/commit/90e98bb8239ae67d4d349b24263cad51a3b78609))


### Features

* **http-gateway:** Remove http gateway, closes [#23](https://github.com/zenflow/composite-service/issues/23) ([62b147f](https://github.com/zenflow/composite-service/commit/62b147f5e6ed9ab5d86243bf7813d718ac42b482))

# [0.8.0](https://github.com/zenflow/composite-service/compare/v0.7.0...v0.8.0) (2020-10-27)


### Features

* **core:** Improve logging: messages, levels, & formatting. Closes [#9](https://github.com/zenflow/composite-service/issues/9) ([3b4bec6](https://github.com/zenflow/composite-service/commit/3b4bec66117b460b794bcc5bd920d4e2eabbc864))

# [0.7.0](https://github.com/zenflow/composite-service/compare/v0.6.0...v0.7.0) (2020-09-21)


### Bug Fixes

* **core:** Read PATH & PATHEXT /w case insensitivity, normalize on write ([c3f8612](https://github.com/zenflow/composite-service/commit/c3f86125b73eb3a6c2d52e9ee4b5773ada4e1287))


### Features

* **core:** Use `process.env` as default `env` service config ([64ecf07](https://github.com/zenflow/composite-service/commit/64ecf07fc5e46b8555b4401c996015a548f01f99))

# [0.6.0](https://github.com/zenflow/composite-service/compare/v0.5.0...v0.6.0) (2020-09-21)


### Bug Fixes

* **core:** Don't report "Started composite service" when shutting down ([92d1952](https://github.com/zenflow/composite-service/commit/92d195226db08fbeaed5c9664a02732ab0f0f42b))


### Features

* **core:** Add serviceDefaults config ([701b47c](https://github.com/zenflow/composite-service/commit/701b47cf51446df00260bf50562fac0b06981449))
* **core:** Force kill each service after forceKillTimeout milliseconds ([645a5df](https://github.com/zenflow/composite-service/commit/645a5dfeb2fdd80ff0746a92b05b372528d55ce7))

# [0.5.0](https://github.com/zenflow/composite-service/compare/v0.4.0...v0.5.0) (2020-09-16)


### Features

* **core:** Handle ctrl+c keystrokes properly & add windowsCtrlCShutdown ([690851f](https://github.com/zenflow/composite-service/commit/690851fb89b37f40309dae0afc6b98d63ef33b09))
* **http-gateway:** Upgrade 'serialize-javascript' to version 5 ([176f54b](https://github.com/zenflow/composite-service/commit/176f54b4800c497d212c2ba2ebf53b1a56dcdf6d))

# [0.4.0](https://github.com/zenflow/composite-service/compare/v0.3.3...v0.4.0) (2020-09-13)


### Features

* **core:** Make "graceful shutdown" opt-in & handle exit signals better ([ac5539c](https://github.com/zenflow/composite-service/commit/ac5539ce2daa344b6be247361296346027326ec2))

## [0.3.3](https://github.com/zenflow/composite-service/compare/v0.3.2...v0.3.3) (2020-09-10)


### Bug Fixes

* **core:** Set prototype & name for custom errors ([99601be](https://github.com/zenflow/composite-service/commit/99601be4308ff6d9d31bcf6a3e72f4dd35232b45))

## [0.3.2](https://github.com/zenflow/composite-service/compare/v0.3.1...v0.3.2) (2020-08-07)


### Bug Fixes

* **package:** Remove useless dependency on @scarf/scarf ([21bcc4b](https://github.com/zenflow/composite-service/commit/21bcc4be2a08ef8711aac11dead39443d01634cc))

## [0.3.1](https://github.com/zenflow/composite-service/compare/v0.3.0...v0.3.1) (2020-08-07)


### Bug Fixes

* **http-gateway:** Bump http-proxy-middleware patch version ([5a32447](https://github.com/zenflow/composite-service/commit/5a3244787e2b263b94fda976d571894949cab86b))
* **onceTcpPortUsed:** Handle ETIMEDOUT errors ([394d43f](https://github.com/zenflow/composite-service/commit/394d43f58d3d43d82dbf647ecb3b86f7d2f65d60))

# [0.3.0](https://github.com/zenflow/composite-service/compare/v0.2.2...v0.3.0) (2020-07-21)


### Features

* **core:** Eliminate trailing blank lines from stdout & stderr ([35ffa82](https://github.com/zenflow/composite-service/commit/35ffa82f5b3860227fbf3fc43c4bc79e0f785c92))

## [0.2.2](https://github.com/zenflow/composite-service/compare/v0.2.1...v0.2.2) (2020-07-21)


### Bug Fixes

* **core:** When piping multiple streams to single destination, do so safely ([85e5761](https://github.com/zenflow/composite-service/commit/85e5761687f1e7a21f0abe957780069446c58822))

## [0.2.1](https://github.com/zenflow/composite-service/compare/v0.2.0...v0.2.1) (2020-07-17)


### Bug Fixes

* **core:** When piping a stream to multiple destinations, do so safely ([0d32c17](https://github.com/zenflow/composite-service/commit/0d32c17871c52aebdd8823731561594f051b19cd))

# [0.2.0](https://github.com/zenflow/composite-service/compare/v0.1.1...v0.2.0) (2020-07-16)


### Features

* **package:** Use [scarf](https://docs.scarf.sh/) ([15c4831](https://github.com/zenflow/composite-service/commit/15c48317129dbe3ad829173e4e03bf3cc6dfee0c))

## [0.1.1](https://github.com/zenflow/composite-service/compare/v0.1.0...v0.1.1) (2020-07-13)


### Bug Fixes

* **package:** remove sourcemaps from package files ([0a1b25e](https://github.com/zenflow/composite-service/commit/0a1b25e80e712fd9b8f1ef78554a655ca2349384))
