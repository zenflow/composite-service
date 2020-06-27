---
title: Errors
---

A composite server can error and crash in a number of ways:

1. A composite service was already started in this process
2. Invalid configuration
3. Error spawning process (e.g. EPERM, etc.)
4. Error in `ready` function
5. Service crashed before ready (Note that "service crashed after ready" is not fatal,
and will be handled by restarting the service.)

In these cases, any running composed services are stopped and the process exits.
