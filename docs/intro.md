---
title: Introduction
---

## What is composite-service?

`composite-service` is a Node.js library
to help you run multiple services as a single service.

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

The above script will:

1. Start composed services (`worker` & `web`) with their respective `cwd` (current working directory), `command` and `env` (environment variables)
2. Pipe stdout & stderr from composed services to stdout, each line prepended with the service ID
3. Restart composed services when they crash
4. Shut down composed services when it is itself told to shut down

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
