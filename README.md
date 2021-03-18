# composite-service

> Compose multiple services into one

[![npm version](https://img.shields.io/npm/v/composite-service)](http://npmjs.com/package/composite-service)
[![CI status](https://img.shields.io/github/workflow/status/zenflow/composite-service/CI?logo=GitHub&label=CI)](https://github.com/zenflow/composite-service/actions?query=branch%3Amaster)
[![dependencies status](https://img.shields.io/david/zenflow/composite-service)](https://david-dm.org/zenflow/composite-service)
[![devDependencies status](https://img.shields.io/david/dev/zenflow/composite-service)](https://david-dm.org/zenflow/composite-service?type=dev)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability-percentage/zenflow/composite-service?logo=Code%20Climate)](https://codeclimate.com/github/zenflow/composite-service)
[![LGTM alerts](https://img.shields.io/lgtm/alerts/github/zenflow/composite-service?logo=lgtm)](https://lgtm.com/projects/g/zenflow/composite-service/)
[![Known Vulnerabilities](https://snyk.io/test/github/zenflow/composite-service/badge.svg?targetFile=package.json)](https://snyk.io/test/github/zenflow/composite-service?targetFile=package.json)

In essence, `composite-service` is a Node.js library to use in a script that composes multiple services into one "composite service", by managing a child process for each composed service.

A composite service script is useful for packaging an application of multiple services or process types (e.g. a frontend web app & a backend web api) **within a single Docker image**, for simplified delivery and deployment.
That is, if you have multiple services that make up your overall application, you do **not** need to deploy them to your hosting individually (multiplying cost & weakening manageability), **nor** do you need to use more advanced/complex tools like Kubernetes to manage your deployments; You can just bundle the services together with a composite service script.

## Features

- Configuration lives in a script, not .json or .yaml file & therefore supports startup tasks and dynamic configurations
- Includes TypeScript types, which means autocompletion and code intelligence in your IDE even if you're writing JavaScript
- Configurable [Crash Handling](#crash-handling) with smart default
- [Graceful Startup](#graceful-startup), to ensure a service is only started after it's declared dependencies (other composed services) are ready
- Option to do "graceful shutdown", similar to "graceful startup"
- Option to terminate all service processes with a single CTRL_C_EVENT on Windows, allowing each process to clean up and exit gracefully as it would on a UNIX-based system
- Supports executing Node.js CLI programs by name
- **[Companion `composite-service-http-gateway` package](https://github.com/zenflow/composite-service-http-gateway)**

## Table of Contents

- [Install](#install)
- [Basic Usage](#basic-usage)
- [Crash Handling](#crash-handling)
  - [Default Behavior](#default-behavior)
  - [Configuring Behavior](#configuring-behavior)
- [Graceful Startup](#graceful-startup)

## Install

```
npm install composite-service
```

## Basic Usage

Create a Node.js script that calls the exported `startCompositeService` function with a
[`CompositeServiceConfig`](src/interfaces/CompositeServiceConfig.ts) object.
That object includes a `services` property, which is a collection of
[`ServiceConfig`](src/interfaces/ServiceConfig.ts) objects keyed by service ID.

*The **complete** documentation for these config object interfaces is in the source code (
[`CompositeServiceConfig.ts`](src/interfaces/CompositeServiceConfig.ts)
& [`ServiceConfig.ts`](src/interfaces/ServiceConfig.ts)
) and should be accessible with code intelligence in most IDEs.
Please use this as your main reference when using `composite-service`.*

The most basic properties of `ServiceConfig` are:

- `cwd` Current working directory of the service. Defaults to `'.'`.
- `command` Command used to run the service. **Required.**
- `env` Environment variables to pass to the service. Defaults to `process.env`.

#### Example

```js
const { startCompositeService } = require('composite-service')

const { PORT, DATABASE_URL } = process.env

startCompositeService({
  services: {
    worker: {
      cwd: `${__dirname}/worker`,
      command: 'node main.js',
      env: { DATABASE_URL },
    },
    web: {
      cwd: `${__dirname}/web`,
      command: ['node', 'server.js'],
      env: { PORT, DATABASE_URL },
    },
  },
})
```

The above script will:

1. Start the described services (`worker` & `web`) with their respective configuration
2. Print interleaved stdout & stderr of each service, each line prepended with the service ID
3. Restart services after they crash
4. Shut down services and exit when it is itself told to shut down

## Crash Handling

A "crash" is considered to be when a service exits unexpectedly (i.e. without being told to do so).

### Default behavior

The default behavior for handling crashes is to restart the service *if it already achieved "ready" status*.
If the service crashes *before* becoming "ready" (i.e. during startup), the composite service itself will bail out and crash (shut down & exit).
This saves us from burning system resources (continuously crashing & restarting) when a service is completely broken.

To benefit from this behavior, [`ServiceConfig`](./src/interfaces/ServiceConfig.ts)`.ready` must be defined.
Otherwise, the service is considered ready as soon as the process is spawned,
and therefore the service will always be restarted after a crash, even if it happened during startup.

#### Example

These changes to the initial example will prevent either service from spinning and burning resources when unable to start up:

```diff
const { startCompositeService } = require('composite-service')

const { PORT, DATABASE_URL } = process.env

startCompositeService({
  services: {
    worker: {
      cwd: `${__dirname}/worker`,
      command: 'node main.js',
      env: { DATABASE_URL },
+     // ready once a line of console output matches /^Started /
+     ready: ctx => ctx.onceOutputLine(line => line.match(/^Started /))
    },
    web: {
      cwd: `${__dirname}/web`,
      command: ['node', 'server.js'],
      env: { PORT, DATABASE_URL },
+     // ready once port is accepting connections
+     ready: ctx => ctx.onceTcpPortUsed(PORT),
    },
  },
})
```

### Configuring behavior

Crash handling behavior can be configured with [`ServiceConfig`](./src/interfaces/ServiceConfig.ts)`.onCrash`.
This is a function executed each time the service crashes,
to determine whether to restart the service or to crash the composite service,
and possibly perform arbitrary tasks such as sending an email or calling a web hook.
It receives an [`OnCrashContext`](./src/interfaces/OnCrashContext.ts) object with some contextual information.

The default crash handling behavior (described in the section above) is implemented as the default value for `onCrash`.
You may want to include this logic in your own custom `onCrash` functions:

```js
ctx => {
  if (!ctx.isServiceReady) throw new Error('Crashed before becoming ready')
}
```

#### Example

```js
const { startCompositeService } = require('composite-service')

startCompositeService({
  services: { ... },
  // Override configuration defaults for all services
  serviceDefaults: {
    onCrash: async ctx => {
      // Crash composite process if service crashed before becoming ready
      if (!ctx.isServiceReady) throw new Error('Crashed before becoming ready')
      // Try sending an alert via email (but don't wait for it or require it to succeed)
      email('me@mydomain.com', `Service ${ctx.serviceId} crashed`, ctx.crash.logTail.join('\n'))
        .catch(console.error)
      // Do "something async" before restarting the service
      await doSomethingAsync()
    },
  },
})
```

## Graceful Startup

If we have a service that depends on another service or services,
and don't want it to be started until the other "dependency" service or services are "ready",
we can define [`ServiceConfig`](./src/interfaces/ServiceConfig.ts)`.dependencies`.
A service will not be started until all its dependencies have started and become ready.

For this to work, [`ServiceConfig`](./src/interfaces/ServiceConfig.ts)`.ready` must be defined for each dependency service.
Otherwise, the service is considered ready as soon as the process is spawned.

#### Example

The following script will start `web` only after `api` is accepting connections.
This prevents `web` from appearing ready to handle requests before it's actually ready,
and allows it to safely make calls to `api` during startup.

```js
const { startCompositeService } = require('composite-service')

const webPort = process.env.PORT || 3000
const apiPort = process.env.API_PORT || 8000

startCompositeService({
  services: {
    web: {
      dependencies: ['api'],
      command: 'node web/server.js',
      env: { PORT: webPort, API_ENDPOINT: `http://localhost:${apiPort}` },
      ready: ctx => ctx.onceTcpPortUsed(webPort),
    },
    api: {
      command: 'node api/server.js',
      env: { PORT: apiPort },
      ready: ctx => ctx.onceTcpPortUsed(apiPort),
    },
  },
})
```
