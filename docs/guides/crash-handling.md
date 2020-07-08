---
title: Crash Handling
---

By default, a service crashing will be handled by restarting the service.

We can use the [ServiceConfig.onCrash function](../api/composite-service.serviceconfig.oncrash.md)
to execute some custom code (sync or async) *before* restarting.

`onCrash` is called with a [OnCrashContext](../api/composite-service.oncrashcontext.md)
object as its only argument.

Unhandled errors from `onCrash` will cause composite service to crash.
This can be used to (conditionally or unconditionally)
propagate crashes to the overall composite service
(i.e. cause the whole composite service to shut down and exit).

## Examples

Crash the composite service:

```js
function onCrash () {
  throw new Error('Crashed')
}
```

---

Crash the composite service
if the composed service crashed without becoming ready
(i.e. it crashed during startup):

```js
function onCrash (ctx) {
  if (!ctx.isServiceReady) {
    throw new Error('Crashed without becoming ready')
  }
}
```

---

Try doing something async **before** the service is restarted:

```js
async function onCrash () {
  await doSomethingAsync().catch(console.error)
}
```

---

Try doing something async **while** the service is restarted:

```js
function onCrash () {
  doSomethingAsync().catch(console.error)
}
```

---

Try emailing myself the log tail if the composed service's last 10 crashes happened inside of an hour:

```js
const myServiceConfig = {
  command: 'node service.js',
  logTailLength: 20,
  onCrash (ctx) {
    if (ctx.crashes.length >= 10) {
      const tenthLastCrash = ctx.crashes.slice(-10, 1)[0]
      const timespan = ctx.crash.date - tenthLastCrash.date
      if (timespan < 1000 * 60 * 60) {
        email(
          'me@me.com',
          'Last 10 crashes happened inside of an hour!',
          ctx.crash.logTail,
        ).catch(console.error)
      }
    }
  }
}
```

Note that defining [`logTailLength`](../api/composite-service.serviceconfig.logtaillength.md) (as above)
is necessary in order for [`ctx.crash.logTail`](../api/composite-service.servicecrash.logtail.md) to have any lines.
