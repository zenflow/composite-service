---
title: Crash Handling
---

By default, a service crashing will be handled by restarting the service.

If we want to configure some custom crash-handling behavior, we can use the
[ComposedServiceConfig.handleCrash property](../api/composite-service.composedserviceconfig.handlecrash.md).


## Examples

Crash the composite service:

```js
function handleCrash () {
  throw new Error('Crashed')
}
```

Crash the composite service
if the composed service crashed without becoming ready
(i.e. it crashed during startup):

```js
function handleCrash (ctx) {
  if (!ctx.isServiceReady) {
    throw new Error('Crashed without becoming ready')
  }
}
```

Try doing something async **before** the service is restarted:

```js
async function handleCrash () {
  await doSomethingAsync().catch(console.error)
}
```

Try doing something async **while** the service is restarted:

```js
function handleCrash () {
  doSomethingAsync().catch(console.error)
}
```

Try emailing myself if the composed service crashed for the 10th time inside of an hour:

```js
function handleCrash (ctx) {
  if (ctx.crashes.length >= 10) {
    const tenthLastCrash = ctx.crashes.slice(-10, 1)[0]
    const timespan = ctx.crash.date - tenthLastCrash.date
    if (timespan < 1000 * 60 * 60) {
      email(
        'me@me.com',
        'Crashed for 10th time inside of an hour!',
        JSON.stringify(ctx)
      ).catch(console.error)
    }
  }
}
```
