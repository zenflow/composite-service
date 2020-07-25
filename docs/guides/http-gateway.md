---
title: HTTP Gateway
---

If we want to expose some composed HTTP services
through a single HTTP service (on a single port)
which proxies requests to the appropriate composed service according to the URL,
we can use the included generic HTTP gateway service
instead of writing a custom one every time.

The HTTP gateway can be configured by calling the
[configureHttpGateway function](../api/composite-service.configurehttpgateway.md)
with a [HttpGatewayConfig](../api/composite-service.httpgatewayconfig.md) object.
This returns a [ServiceConfig](../api/composite-service.serviceconfig.md) object
to use in a [CompositeServiceConfig](../api/composite-service.compositeserviceconfig.md) object.

## Example

The following composite service includes a `gateway` service that proxies
all requests with URL under `/api` to the `api` service,
and all other requests to the `web` service.

```js
const {
  startCompositeService,
  configureHttpGateway,
} = require('composite-service')

const [apiPort, webPort] = [8000, 8001]

startCompositeService({
  services: {
    api: {
      command: 'node api/server.js',
      env: { PORT: apiPort },
    },
    web: {
      command: 'node web/server.js',
      env: { PORT: webPort },
    },
    gateway: configureHttpGateway({
      port: process.env.PORT,
      proxies: [
        ['/api', { target: `http://localhost:${apiPort}` }],
        ['/', { target: `http://localhost:${webPort}` }],
      ],
    }),
  },
})
```

The following changes enable [Graceful Startup & Shutdown](./graceful-startup-shutdown.md),
meaning `gateway` is started only after `api` and `web` are both ready to handle requests.

```diff
const {
  startCompositeService,
+ onceTcpPortUsed,
  configureHttpGateway,
} = require('composite-service')

const [apiPort, webPort] = [8000, 8001]

startCompositeService({
  services: {
    api: {
      command: 'node api/server.js',
      env: { PORT: apiPort },
+     ready: () => onceTcpPortUsed(apiPort),
    },
    web: {
      command: 'node web/server.js',
      env: { PORT: webPort },
+     ready: () => onceTcpPortUsed(webPort),
    },
    gateway: configureHttpGateway({
+     dependencies: ['api', 'web'],
      port: process.env.PORT,
      proxies: [
        ['/api', { target: `http://localhost:${apiPort}` }],
        ['/', { target: `http://localhost:${webPort}` }],
      ],
    }),
  },
})
```