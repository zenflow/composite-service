# TODO

- logLevel
- stopWith ctrl+c
- crashing.test.ts: check value of OnCrashContext.isServiceReady
- buffering stdout/stderr twice? (also in child_process.ChildProcess?)
- inline TODOs
- check for excess config fields
- tests
    - unit tests for validation
    - use ctrl+c to shutdown composite service (for Windows compat)
- publish v0.1.0

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
