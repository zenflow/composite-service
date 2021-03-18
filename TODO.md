# TODO

readme: shutdown options in Features section: link to src docs
readme: Fatal Errors section (moved out of startCompositeService.ts)
readme: section for http gateway?

remove minimumRestartDelay
default logTailLength = 5
default crashesLength = 3

simplify test utils by using `stream-line-reader` packge
ugly output for crashing from error in onCrash/ready

- bugs
    - without windowsCtrlCShutdown=true, composed service programs like `nodemon` (which have their own child process) cannot be stopped on Windows
      - make note that windowsCtrlCShutdown may be needed if your service has it's own subprocesses
- docs
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
    - PR to add composite-service example to https://docs.docker.com/config/containers/multi-service_container/
