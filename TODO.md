# TODO

- remove map-stream package + types/index.d.ts
- dont remove /n from output stream lines
- use AsyncIterable (`for await (const foo of bar)`) for stream processing, improving API types
    - https://github.com/SocketCluster/socketcluster-server#benefits-of-async-iterable-over-eventemitter

- use schema validator instead of long & complex normalizeAndValidate function
    - check for excess config fields
    - unit tests for validation

- use `@default` annotation in TypeDoc comments and make sure it shows up on website *in tables*

---

- semantic release
- documentation, community & marketing
    - TypeScript badge link
    - badge https://nodei.co/npm/composite-service.png?compact=true
    - badges from shields.io
        - GitHub Issues & PRs should just say "Welcome"
        - David devDependencies
        - Cross-platform compatible
        - "node-lts"
        - "node-current"
        - "Dependent repos (via libraries.io)"
        - snyk ... but only for main package.json
        ![Snyk Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/composite-service?logo=snyk)
        ![Snyk Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/zenflow/composite-service?logo=snyk)
    - https://github.com/zenflow/composite-service/community
    - github stars somwhere on website to encourage starring
    - package.keywords
    - include README badges & *especially* links on website
    - Gitter vs Spectrum
        - https://news.ycombinator.com/item?id=18571041
        - https://stackshare.io/stackups/gitter-vs-spectrum#:~:text=According%20to%20the%20StackShare%20community,stacks%20and%206%20developer%20stacks.
- fix snyk vulnerabilities/github/zenflow/composite-service: https://app.snyk.io/org/zenflow/project/13586e3c-b927-41c7-8052-c6190708084c/

---

- stopWith ctrl+c
    - in tests use ctrl+c to shutdown composite service (for Windows compat)
- crashing.test.ts: check value of OnCrashContext.isServiceReady
- buffering stdout/stderr twice? (also in child_process.ChildProcess?)
- inline TODOs
- publish v0.1.0

---

- codesandbox example /w node/nodemon microservice + parcel app + http gateway
- issues
    - packages `require`d in HttpProxyOptions.onOpen, HttpProxyOptions.onClose, etc.
    may be wrong version due to cwd
- docs: Development Mode guide
- docs: more examples in guide on configuring http-proxy-middleware
- docs: separate motivation
- `npm it` should work
- docs: contributing (section & notice soliciting contributions)
- website:
  - nicer theme
  - frontpage SVG animation
  - sitemap - docusaurus-plugin-sitemap
  - social media metadata - https://metatags.io
  - versioning?
    - docusaurus's versioning feature?
    - publish on unpkg.com?
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
