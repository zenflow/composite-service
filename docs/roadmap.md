---
title: Roadmap
---

`composite-service` is still young,
so please let me know what features would be most valuable to you,
using [GitHub Issues](https://github.com/zenflow/composite-service/issues).

## Planned Features

1. config `verbosity`
2. service config `restartDelay`, default: 1000
3. service config `cwd: string` (reminder: PATH env var)
4. use `npm-run-path` package
5. service config `stopWith: 'ctrl+c' | 'SIGINT' | 'SIGTERM' | ...`

*(in no particular order)*

## Feature Ideas

1. config `serviceDefaults: ComposedServiceConfig`
2. port utilities: `assertPortFree(port)` & `findPorts(numberOfPorts, options)` (use it like: `const [apiPort, webPort] = findPorts(2, { exclude: PORT })`)
3. use AsyncIterable for stream processing, improving API types
4. service configs `beforeStarting`, `afterStarted`, `beforeStopping`, `afterStopped`: event handler or "hook" functions
5. service config `readyTimeout`: milliseconds to wait for service to be "ready" before giving up and erroring
6. service config `forceKillTimeout`: milliseconds to wait before sending SIGKILL
7. http gateway: logging
8. http gateway: stop accepting new requests, but finish pending requests, when SIGTERM received
9. http gateway: support making calls over a Unix domain socket instead of a port
10. service configurator `configureNodeCluster({script: 'path/to/script.js', scale: 4})` which uses same node binary that main process was started with

*(in no particular order)*
