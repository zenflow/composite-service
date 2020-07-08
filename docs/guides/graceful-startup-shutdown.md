---
title: Graceful Startup & Shutdown
---

If we want to start a service *only after some other service or services are ready*,
we can use the following [ServiceConfig](../api/composite-service.serviceconfig.md) properties:

- [`ready`](../api/composite-service.serviceconfig.ready.md)
A function to determine when the service is ready
- [`dependencies`](../api/composite-service.serviceconfig.dependencies.md)
IDs of other composed services that this service depends on

A service will not be started until all its dependencies are started and ready,
and none of a service's dependencies will be stopped until the service has stopped.

This library includes a collection of
[Ready Helpers](../api/composite-service.oncetcpportused.md)
to help you define the `ready` service config.

## Example

Suppose we have two http services:

1. `api`: independent of any other service
2. `web`: makes requests to `api`

We want to start `web` only after `api` is ready to handle requests.
This way,
**(1)** `web` does not appear to be ready before it's really ready to handle requests,
and **(2)** `web` can safely make requests to `api` during startup.

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
