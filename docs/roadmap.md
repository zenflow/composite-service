---
title: Roadmap
---

`composite-service` is still young,
so please let me know what features would be most valuable to you,
using [GitHub Issues](https://github.com/zenflow/composite-service/issues).

## Planned Features

1. config `logLevel`
2. service config `stopWith: 'ctrl+c' | 'SIGINT' | 'SIGTERM' | ...`

*(in no particular order)*

## Feature Ideas

1. config `serviceDefaults: ComposedServiceConfig`
2. port utilities: `assertPortFree(port)` & `findPorts(numberOfPorts, options)` (use it like: `const [apiPort, webPort] = findPorts(2, { exclude: PORT })`)
3. use AsyncIterable for stream processing, improving API types
4. service configs `beforeStarting`, `afterStarted`, `beforeStopping`, `afterStopped`: event handler or "hook" functions
5. service config `readyTimeout`: milliseconds to wait for service to be "ready" before giving up and erroring
6. service config `forceKillTimeout`: milliseconds to wait before sending SIGKILL
7. http gateway
    - logging
    - stop accepting new requests, but finish pending requests, when SIGTERM received
    - support making calls over a Unix domain socket, e.g. `unix:/path/to/socket.sock` instead of host & port
8. service configurator `configureNodeCluster({script: 'path/to/script.js', scale: 4})` which uses same node binary that main process was started with

*(in no particular order)*
