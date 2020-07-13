---
title: Introduction
---

## What is composite-service?

`composite-service` is a Node.js library
to help you run multiple services as if they were a *single* service,
running under a *single* process from a *single* command.

`composite-service` lets you implement a "composite service"
in a flexible, explicit & easy-to-read script like this:

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

**The above script will:**

1. Start composed services (`worker` & `web`) with their respective `cwd` (current working directory), `command` and `env` (environment variables)
2. Pipe stdout & stderr from composed services to stdout, each line prepended with the service ID
3. Restart composed services when they crash
4. Shut down composed services when it is itself told to shut down

### Standard for a "service"

A composed service can be any program that fits this description:

1. Runs in the foreground of the terminal
2. Doesn't require any input to stdin
3. Should run until receiving a shutdown signal. Should not exit by itself, as that would be considered a crash.

The composite service shares each of the above characteristics.
However, if any fatal error occurs, the composite service will shut down any running services and crash.

## Features

1. Supports [Graceful Startup & Shutdown](guides/graceful-startup-shutdown.md)
2. Configurable [Crash Handling](guides/crash-handling.md) (default is to just restart the service)
3. Includes fluently configurable [HTTP Gateway](guides/http-gateway.md)
4. Supports executing Node.js CLI programs by name in [ServiceConfig.command](api/composite-service.serviceconfig.command.md)

...and more to come. See [Roadmap](roadmap.md).

## Motivation

### Reusing Services

Sometimes we want to use some open-source (or just reusable) service in our app or service.
In the cases where we would like to include that reusable service as a component of our overall service,
rather than creating and managing an external dependency,
we can use `composite-service` to compose everything into a single service.

### Advantages of Running As a Single Service

1. Simplified deployments & devops; works smoothly with any PaaS provider; never a need to update production services in a certain order
2. Allows us to effectively use PaaS features like [Heroku's Review Apps](https://devcenter.heroku.com/articles/github-integration-review-apps)
3. With some PaaS providers (e.g. Heroku, render) saves the cost of hosting additional "apps" or "services"
4. Fewer steps (i.e. one step) to start the entire system (locally or in CI) for integration testing (manual or automated), and sometimes even for local development

### Microservices

Another possible use case is to develop & deploy a system of microservices as a single service,
to keep the advantages listed above, while gaining many of the advantages of microservices:
- Services can be developed independently, in different repositories, by different teams, **and or** in different languages
- One service crashing doesn't interrupt the others

Since the composed services still, on a lower level, run as independent programs,
they can easily be *de*composed at any time,
and run as separate services.
