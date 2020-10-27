# TODO

- api
    - `gracefulShutdown` option should be `sequentialShutdown` instead
    - onCrash error handling should restart, onCrash should signal to crash by returning a Symbol
    - default `onCrash` should be like `(ctx) => ctx.isServiceReady ? kRestartService : kRaiseFatalError`
- bugs
    - http gateway: not intuitive or desirable that `/fooz` matches `/foo` context
    - packages `require`d in HttpProxyOptions.onOpen, HttpProxyOptions.onClose, etc. may be wrong version due to cwd
    - without windowsCtrlCShutdown=true, composed service programs like `nodemon` (which have their own child process) cannot be stopped on Windows
- docs
    - move details from `startCompositeService` doc comment to docs/intro.md, & replace with "See intro for more detailed specs"
        - within that documentation, improve stuff on shutting down & fatal errors
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
