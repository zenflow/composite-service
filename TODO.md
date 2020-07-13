# TODO

- issues
    - HttpGatewayConfig validation
    - packages `require`d in HttpProxyOptions.onOpen, HttpProxyOptions.onClose, etc. may be wrong version due to cwd
- `npm it` should work!
- tests
    - crashing.test.ts: check value of OnCrashContext.isServiceReady
- docs
    - Development Mode guide
    - more examples in guide on configuring http-proxy-middleware
    - separate motivation
    - contributing (section & notice soliciting contributions)
    - "Similar Projects" section
        1. https://github.com/docker/compose
        2. https://github.com/Unitech/pm2
        3. https://github.com/godaddy/node-cluster-service
- community
    - https://github.com/zenflow/composite-service/community
    - Gitter vs Spectrum
        - https://news.ycombinator.com/item?id=18571041
        - https://stackshare.io/stackups/gitter-vs-spectrum#:~:text=According%20to%20the%20StackShare%20community,stacks%20and%206%20developer%20stacks.
- website
    - nicer theme
    - codesandbox example /w node/nodemon microservice + parcel app + http gateway
    - github stars somwhere on website to encourage starring
    - include README badges & *especially* links on website
    - frontpage SVG animation
    - sitemap - docusaurus-plugin-sitemap
    - social media metadata - https://metatags.io
    - give landing-page love
        - https://faastjs.org/
        - https://repeater.js.org/
        - https://gqless.dev/
        - https://uniforms.tools/
    - search function https://docsearch.algolia.com/

---

- Nodejs issues
    - no ChildProcess 'started' event
    - child_process.spawn uses scripts initial process.env, not updated process.env
- PR to add composite-service example to https://docs.docker.com/config/containers/multi-service_container/
