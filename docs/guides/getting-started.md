---
title: Getting Started
---

## Requirements

Node.js version >= 10

## Installing

Install [`composite-service`](https://www.npmjs.com/package/composite-service)
from the npm package registry:

With npm:

```shell script
npm install composite-service
```

Or with yarn:

```shell script
yarn add composite-service
```

## Basic Usage

Create a Node.js script that calls the
[startCompositeService function](../api/composite-service.startcompositeservice.md)
with a [CompositeServiceConfig](../api/composite-service.compositeserviceconfig.md) object,
which includes a [services property](../api/composite-service.compositeserviceconfig.services.md),
which is a collection of [ServiceConfig](../api/composite-service.serviceconfig.md) objects keyed by service ID.

The most basic properties of [ServiceConfig](../api/composite-service.serviceconfig.md) are:
- [`cwd`](../api/composite-service.serviceconfig.cwd.md)
Current working directory of the service. Defaults to `'.'`.
- [`command`](../api/composite-service.serviceconfig.command.md)
Command used to run the service. **Required.**
- [`env`](../api/composite-service.serviceconfig.env.md)
Environment variables to pass to the service. Defaults to `{}`.

### Example

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

## Basic Tips

### Explore API Reference

- [startCompositeService function](../api/composite-service.startcompositeservice.md)
for general specifications
- [CompositeServiceConfig interface](../api/composite-service.compositeserviceconfig.md)
& [ServiceConfig interface](../api/composite-service.serviceconfig.md)
for configuration options

### Define each environment variable explicitly

You may notice that environment variables are not propagated to the services by default;
you are required to define the exact collection of environment variables.

You can easily just include everything from `process.env`,
but you should consider instead passing each necessary variable *explicitly*,
in order to maintain a clear picture of which variables are used by which service.

### Define absolute CWDs

You can easily define a *relative* path for `cwd`,
to be resolved from the CWD of the composite service,
or even omit `cwd` altogether,
but this makes your composite service script dependent on the CWD from which it was called.

You should consider defining an absolute path for every `cwd`,
so that calling your composite service script from different directories
yields consistent results.

Most of the examples here won't follow this approach,
simply for the sake of brevity.
