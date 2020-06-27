---
title: 'What?'
---

`composite-service` is a Node.js library
to help you run multiple services as if they were a *single* service,
running under a *single* process.

`composite-service` lets you implement a "composite service"
in a declarative and fairly intuitive script like this:

```js
const { startCompositeService } = require('composite-service')

const { PORT, DATABASE_URL } = process.env

startCompositeService({
  services: {
    worker: {
      command: 'node worker.js',
      env: { DATABASE_URL },
    },
    http: {
      command: 'node http-server.js',
      env: { PORT, DATABASE_URL },
    },
  },
})
```

**The above script will:**

1. Start each composed service (`http` and `worker`) by spawning a process with the given `command` and `env` (environment variables)
2. Merge the stdout & stderr of every spawned process and pipe it to stdout, each line prepended with the service name
3. Restart composed services when they crash
4. Shut down each composed service when it is itself told to shut down (with `ctrl+c`, `SIGINT`, or `SIGTERM`)

**A composed service can be any program that fits this description:**
1. Runs in the foreground of the terminal
2. Doesn't require any input to stdin
3. Should run until receiving a shutdown signal. Should not exit by itself, as that would be considered a crash.

The composite service shares each of the above characteristics,
*however*, if any [fatal error](../guides/errors.md) occurs,
the composite service will shut down any running services and exit.


## Features

1. Supports [Graceful Startup & Shutdown](../guides/graceful-startup-shutdown.md)
3. Includes configurable [HTTP Gateway](../guides/http-gateway.md)
