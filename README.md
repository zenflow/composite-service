# composite-service

Helps you run multiple services as one

### Fatal errors
    - Invalid configuration
    - Error spawning process (e.g. EPERM, etc.)
    - Error in `ready` function
    - Service crashed before ready (Note that "service crashed after ready" is not fatal, and will be handled by restarting the service.)

### Graceful startup (TODO: and shutdown)

Building on the previous example,
suppose we want to start `web` only once `api` has started up and is ready to handle requests.
This way:
1. `web` does not appear to be ready before it's really ready to handle requests (recall that `web` makes calls to `api`)
2. `web` can safely make calls to `api` during startup

You can use the `ready` & `dependencies` service configs to accomplish this.

Each service is started only once all services listed in its `dependencies` are
started and "ready" according to their respective `ready` configs.

The `ready` config is a function that takes a `ReadyConfigContext` object as its argument
and returns a promise that resolves once the service is ready.
Its default is `() => Promise.resolve()`, which means the service is considered ready as soon as the process is successfully spawned.

The `ReadyConfigContext` object has the following properties:
- `output`: [readable stream](https://nodejs.org/api/stream.html#stream_class_stream_readable) of lines (as strings) from stdout & stderr

This package includes several helper functions for the `ready` config:
- `oncePortUsed(port: number | string, host = 'localhost'): Promise<void>`
- `onceOutputLineIs(output: stream.Readable, value: string): Promise<void>`
- `onceOutputLineIncludes(output: stream.Readable, value: string): Promise<void>`
- `onceOutputLine(output: Readable, test: (line: string) => boolean): Promise<void>`
- `onceTimeout(milliseconds: number): Promise<void>`

**Example:**

The following script will only start `web` once `api` outputs (to stdout or stderr) a line that includes "Listening on port ".

```js
const { startCompositeService, onceOutputLineIncludes } = require('composite-service')

const apiPort = 8000

startCompositeService({
  services: {
    api: {
      command: 'node api/server.js',
      env: {
        PORT: apiPort,
      },
      ready: ctx => onceOutputLineIncludes(ctx.output, 'Listening on port '),
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

### HTTP proxy service

If you want to expose some composed http services through a single http service (on a single port)
which proxies requests to the appropriate composed service depending on the URL,
you can use the included HTTP proxy service instead of writing (and re-writing) your own.

The HTTP proxy service can be configured with the `configureHttpGatewayService` function which
takes the following parameters and returns a service configuration object:
TODO
- `dependencies`: Used as `dependencies` in service configuration object (defaults to `[]`)
- `host`: Host to listen on (defaults to `"0.0.0.0"`)
- `port`: Port to listen on
- `proxies`: Array of `HttpProxyConfig` objects,
each of which has a `context` property,
and any number of http-proxy-middleware options

**Example:**

The following composite service includes an HTTP proxy service which proxies
all requests with URL under `/api` to the `api` service
and all other requests to the `web` service:

```js
const {
  startCompositeService,
  oncePortUsed,
  configureHttpGatewayService,
} = require('composite-service')

const [apiPort, webPort] = [8000, 8001]

startCompositeService({
  services: {
    api: {
      command: 'node api/server.js',
      env: {
        PORT: apiPort,
      },
      ready: () => oncePortUsed(apiPort),
    },
    web: {
      command: 'node web/server.js',
      env: {
        PORT: webPort,
        API_ENDPOINT: `http://localhost:${apiPort}`,
      },
      ready: () => oncePortUsed(webPort),
    },
    proxy: configureHttpGatewayService({
      dependencies: ['api', 'web'],
      port: process.env.PORT,
      proxies: [
        { context: '/api', target: `http://localhost:${apiPort}` },
        { context: '/', target: `http://localhost:${webPort}` },
      ],
    }),
  },
})
```

## Related Projects

TODO: quick comparison of this package to each of projects

- https://github.com/Unitech/pm2
- https://github.com/godaddy/node-cluster-service

## Roadmap

- finish up TODO in README
- simplify tests by having only http-service
- default `config.services[].ready` should be `() => Promise.resolve()`
- fix disabled tests

- count restarts
- consider port safety
- proxy needs NODE_ENV=production?
- rename "http proxy service" to "http gateway service"

- inline TODOs
- check for excess config fields
- tests
    - unit tests for validation
    - use ctrl+c to shutdown composite service (for Windows compat)
- Nodejs issue: no ChildProcess 'started' event

- finish documentation /w "Configuration" section, using tsdoc website if necessary
- publish v3

- service config `restartDelay`, default: 1000
- service config `stopWith: 'ctrl+c' | 'SIGINT' | 'SIGTERM' | ...`
- `verbosity` config
- service config `handleCrash: 'restart-if-started' | 'crash' | 'restart'` defaulting to `'restart-if-started'` which is the current behavior
- service config `cwd: string`
- use `npm-run-path` package
- `assertPortFree` & `const [apiPort, webPort] = findPorts(2, { exclude: PORT })`
- PR to add composite-service example to https://docs.docker.com/config/containers/multi-service_container/

## Feature ideas

- service configs `beforeStarting`, `afterStarted`, `beforeStopping`, `afterStopped`: event handler or "hook" functions
- service config `readyTimeout`: milliseconds to wait for service to be "ready" before giving up and erroring
- service config `forceKillTimeout`: milliseconds to wait before sending SIGKILL
- http proxy service: stop accepting new requests, but finish pending requests, when SIGTERM received
- http proxy service: support making calls over a Unix domain socket instead of a port
- service configurator `configureNodeClusterService({script: 'path/to/script.js', scale: 4})` which uses same node binary that main process was started with

## Changelog

- `v3.0.0`
    - Support composing non-http services (i.e. no http proxy)
    - `dependencies`, `ready`, `restartDelay`, & `stopWith` service configs
    - `verbosity` config
    - Require explicit propagation of environment variables to composed services
    - Revised names & interfaces
- `v2.0.0`
    - Run server procs w/o shell & kill server procs normally (w/o tree-kill) (32723c73467522551bc57da8575f57f59d04d11d)
    - Ensure importing module is free of side-effects (efeab195b234cac153b601dd1e0835cbd53bcf2d)
- `v1.1.0`
    - Shutdown gracefully in non-windows environments (bce5500c99c6eec2acd7262ae70a4e6cb52b9d1c)
- `v1.0.0`
    - Initial commit
