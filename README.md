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
- Does ["graceful startup"](#graceful-startup), ensuring a service is only started after it's declared dependencies (other composed services) are ready
- Option to do "graceful shutdown", similar to "graceful startup"
- Option to terminate all service processes with a single CTRL_C_EVENT on Windows, allowing each process to clean up and exit gracefully as it would on a UNIX-based system
- Configurable crash handling, with sensible default of restarting the service after 1 second
- Supports executing Node.js CLI programs by name
- **[Companion `composite-service-http-gateway` package](https://github.com/zenflow/composite-service-http-gateway)**

## Install

```
npm install composite-service
```

## Basic Usage

Create a Node.js script that calls the exported `startCompositeService` function with a `CompositeServiceConfig` object.
That object includes a `services` property, which is a collection of `ServiceConfig` objects keyed by service ID.
The **complete** documentation for these config object interfaces is in the source code (
[`CompositeServiceConfig.ts`](./src/core/CompositeServiceConfig.ts)
& [`ServiceConfig.ts`](./src/core/ServiceConfig.ts)
) and should be visible with code intelligence in most IDEs.

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
      command: 'node main.js',
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

## Graceful Startup

If we have a service that depends on another service or services,
and don't want it to be started until the other "dependency" service or services are ready,
we can use the following `ServiceConfig` properties:

- `ready` An async (promise-returning) function to determine when the service is ready
- `dependencies` IDs of other composed services that this service depends on

A service will not be started until all its dependencies have started and become ready.

#### Example

The following script will start `web` only once `api` is listening on its given port.

```js
const {
  startCompositeService,
  onceTcpPortUsed,
  onceOutputLine,
} = require('composite-service')

const apiPort = 8000

startCompositeService({
  services: {
    web: {
      dependencies: ['api'],
      command: 'node web/server.js',
      env: {
        PORT: process.env.PORT,
        API_ENDPOINT: `http://localhost:${apiPort}`,
      },
    },
    api: {
      command: 'node api/server.js',
      env: {
        PORT: apiPort,
      },
      // ready when `apiPort` is in use (accepting connections)
      ready: () => onceTcpPortUsed(apiPort),
      // or, ready when a line in the console output passes custom test
      // ready: ctx => onceOutputLine(line => line.match(/^Ready/)),
    },
  },
})
```
