# TODO

- Create Github issues for everything in this document
    - use labels for features/bugs/tests/docs/website/community/upstream
- logger
	- remove the one logger.debug() call
	- replace starting/stopping calls to logger.info() with logger.debug()
	- use logger.info() when
		- restarting crashed service
		- received shutdown signal
- improve formatting of output; introduce "$composite" stream prefix
- ready helpers should be included as 2nd argument in call to `ready` config (adding the imports is annoying)
- default `ready` should be `(ctx, helpers) => helpers.onceTimeout(1000)` ?
- default `onCrash` should be `(ctx, helpers) => !ctx.isServiceReady && helpers.propagateCrash()`

---

- bugs
    - http gateway: not intuitive or desirable that `/fooz` matches `/foo` context
    - packages `require`d in HttpProxyOptions.onOpen, HttpProxyOptions.onClose, etc. may be wrong version due to cwd
    - without windowsCtrlCShutdown=true, composed service programs like `nodemon` (which have their own child process) cannot be stopped on Windows
        - should windowsCtrlCShutdown default to `true`?
- tests
    - check for memory leaks after many service crashes
    - crashing.test.ts: check value of OnCrashContext.isServiceReady
- docs
    - ServiceConfig "Environment variables to pass to the service" -> "Environment variables to pass to the child process"
    - http gateway
        - warnings about using http gateway for production:
        "http gateway is useful for getting up & running quickly,
        and does a pretty good job performing it's function,
        but may not be suitable for serious production deployments.
        Check out https://github.com/awesome-selfhosted/awesome-selfhosted#proxy"
        - https://v2.docusaurus.io/docs/markdown-features#line-highlighting
        - more examples in guide on configuring http-proxy-middleware
- community
    - https://github.com/zenflow/composite-service/community
    - Gitter vs Spectrum
        - https://news.ycombinator.com/item?id=18571041
        - https://stackshare.io/stackups/gitter-vs-spectrum#:~:text=According%20to%20the%20StackShare%20community,stacks%20and%206%20developer%20stacks.
    - PR to add composite-service example to https://docs.docker.com/config/containers/multi-service_container/
