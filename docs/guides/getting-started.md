---
title: Getting Started
---

## Requirements

Node.js version >= 10

## Installing

Install [`composite-service`](https://www.npmjs.com/package/composite-service)
from the npm package registry using npm or Yarn.

## Basic Usage

Create a Node.js script that calls the
[startCompositeService function](../api/composite-service.startcompositeservice.md)
with a [CompositeServiceConfig](../api/composite-service.compositeserviceconfig.md) object.
That object will include a [services property](../api/composite-service.compositeserviceconfig.services.md),
which is a collection of [ServiceConfig](../api/composite-service.serviceconfig.md) objects keyed by service ID.

The most basic properties of [ServiceConfig](../api/composite-service.serviceconfig.md) are:
- [`cwd`](../api/composite-service.serviceconfig.cwd.md)
Current working directory of the service. Defaults to `'.'`.
- [`command`](../api/composite-service.serviceconfig.command.md)
Command used to run the service. **Required.**
- [`env`](../api/composite-service.serviceconfig.env.md)
Environment variables to pass to the service. Defaults to `process.env`.

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

You can discover lots of options for configuration in the docs for
[CompositeServiceConfig](../api/composite-service.compositeserviceconfig.md)
& [ServiceConfig](../api/composite-service.serviceconfig.md).

Also, check out the docs for the [startCompositeService function](../api/composite-service.startcompositeservice.md)
for a general specification.

### Prefer to define each environment variable explicitly

It is likely that many of the environment variables you want to pass to a composed service
will come from `process.env`.
You can easily just include everything from `process.env`,
but you should consider instead passing each necessary variable explicitly,
in order to maintain a clear picture of which variables are used by which service.

### Define absolute CWDs

You are allowed to define `cwd` as a relative path,
to be resolved from the CWD of the composite service.
However, if the CWD for the composed service is actually important,
you should define it as an absolute path,
so that everything works regardless of which directory you start the composite service in.
