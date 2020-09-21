---
title: Graceful Startup & Shutdown
---

## Graceful Startup

If we have a service that depends on another service or services,
and don't want to start that service until the service or services it depends on are ready,
we can use the following [ServiceConfig](../api/composite-service.serviceconfig.md) properties:

- [`ready`](../api/composite-service.serviceconfig.ready.md)
A function to determine when the service is ready
- [`dependencies`](../api/composite-service.serviceconfig.dependencies.md)
IDs of other composed services that this service depends on

A service will not be started until all its dependencies have started and become ready.

This library includes a collection of
[Ready Helpers](../api/composite-service.oncetcpportused.md)
to help you define the `ready` service config.

### Example

Suppose we have two http services:

1. `api`: independent of any other service
2. `web`: makes requests to `api`

We want to start `web` only after `api` is ready to handle requests.
This way:
1. `web` does not appear to be ready before it's really ready to handle requests
2. `web` can safely make requests to `api` during startup

The following script will start `web` only once `api` is listening on its given port.

```js
const {
  startCompositeService,
  onceTcpPortUsed,
} = require('composite-service')

const apiPort = 8000

startCompositeService({
  services: {
    api: {
      command: 'node api/server.js',
      env: {
        PORT: apiPort,
      },
      ready: () => onceTcpPortUsed(apiPort),
    },
    web: {
      dependencies: ['api'],
      command: 'node web/server.js',
      env: {
        PORT: process.env.PORT,
        API_ENDPOINT: `http://localhost:${apiPort}`,
      },
    },
  },
})
```

## Graceful Shutdown

If we want to shut down in a similar manner,
we can opt in by setting [`config.gracefulShutdown`](../api/composite-service.compositeserviceconfig.gracefulshutdown.md) to `true`.
With this config enabled, a service will not be stopped until all services that depend on it have stopped.
