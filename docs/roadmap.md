---
title: Roadmap
---

`composite-service` is still young,
so please let me know what features would be most valuable to you,
using [GitHub Issues](https://github.com/zenflow/composite-service/issues).

## Planned Features

1. service config `stopWith: 'ctrl+c' | 'SIGINT' | 'SIGTERM' | ...`
2. colors in console output to make it more readable

*(in no particular order)*

## Feature Ideas

1. config `serviceDefaults: ServiceConfig`
2. port utilities: `assertPortFree(port)` & `findPorts(numberOfPorts, options)` (use it like: `const [apiPort, webPort] = findPorts(2, { exclude: PORT })`)
3. service configs `beforeStarting`, `afterStarted`, `beforeStopping`, `afterStopped`: event handler or "hook" functions
4. service config `readyTimeout`: milliseconds to wait for service to be "ready" before giving up and erroring
5. service config `forceKillTimeout`: milliseconds to wait before sending SIGKILL
6. http gateway
    - logging
    - stop accepting new requests, but finish pending requests, when SIGTERM received
    - support making calls over a Unix domain socket, e.g. `unix:/path/to/socket.sock` instead of host & port
7. service configurator `configureNodeCluster({script: 'path/to/script.js', scale: 4})` which uses same node binary that main process was started with

*(in no particular order)*