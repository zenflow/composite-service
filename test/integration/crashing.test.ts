import { CompositeProcess } from './helpers/composite-process'
import { redactConfigDump, redactStackTraces } from './helpers/redact'
import { fetchText } from './helpers/fetch'

// TODO: `const delay = promisify(setTimeout)` doesn't work here for some reason
const delay = (time: number) =>
  new Promise(resolve => setTimeout(() => resolve(), time))

function getScript(customCode = '') {
  return `
    const { startCompositeService, onceOutputLineIs } = require('.');
    const config = {
      logLevel: 'debug',
      gracefulShutdown: true,
      serviceDefaults: {
        command: 'node test/integration/fixtures/http-service.js',
        ready: ctx => onceOutputLineIs(ctx.output, 'Started 🚀\\n'),
      },
      services: {
        first: {
          env: { PORT: 8001, RESPONSE_TEXT: 'first' },
        },
        second: {
          dependencies: ['first'],
          env: { PORT: 8002, RESPONSE_TEXT: 'second' },
        },
        third: {
          dependencies: ['first', 'second'],
          env: { PORT: 8003, RESPONSE_TEXT: 'third' },
        },
      },
    };
    ${customCode};
    startCompositeService(config);
  `
}

describe('crashing', () => {
  jest.setTimeout(process.platform === 'win32' ? 45000 : 15000)
  let proc: CompositeProcess | undefined
  afterEach(async () => {
    if (proc) await proc.end()
  })
  it('crashes before starting on error validating configuration', async () => {
    const script = `
      const { startCompositeService } = require('.');
      startCompositeService({
        logLevel: 'debug',
        services: {},
      });
    `
    proc = new CompositeProcess(script)
    await proc.ended
    const output = redactStackTraces(proc.flushOutput())
    output.shift() // ignore first line like "<file path>:<line number>"
    expect(output).toMatchInlineSnapshot(`
      Array [
        "    throw new ConfigValidationError('\`config.services\` has no entries');",
        "    ^",
        "",
        "ConfigValidationError: \`config.services\` has no entries",
        "<stack trace>",
        "",
        "",
      ]
    `)
  })
  it('crashes gracefully on error starting process', async () => {
    const script = getScript(`
      config.services.second.command = 'this_command_does_not_exist';
    `)
    proc = new CompositeProcess(script)
    await proc.ended
    const output = redactStackTraces(redactConfigDump(proc.flushOutput()))
    expect(output).toMatchInlineSnapshot(`
      Array [
        "<config dump>",
        " (debug) Starting composite service...",
        " (debug) Starting service 'first'...",
        "first | Started 🚀",
        " (debug) Started service 'first'",
        " (debug) Starting service 'second'...",
        " (error) Fatal error: Spawning process for service 'second': Error: spawn this_command_does_not_exist ENOENT",
        " (debug) Stopping composite service...",
        " (debug) Stopping service 'first'...",
        " (debug) Stopped service 'first'",
        " (debug) Stopped composite service",
        "",
        "",
      ]
    `)
  })
  it('crashes gracefully on error from ready', async () => {
    const script = getScript(`
      config.services.second.ready = () => global.foo.bar();
    `)
    proc = new CompositeProcess(script)
    await proc.ended
    const output = redactStackTraces(redactConfigDump(proc.flushOutput()))
    expect(output).toMatchInlineSnapshot(`
      Array [
        "<config dump>",
        " (debug) Starting composite service...",
        " (debug) Starting service 'first'...",
        "first | Started 🚀",
        " (debug) Started service 'first'",
        " (debug) Starting service 'second'...",
        " (error) Fatal error: In \`ready\` function for service 'second': TypeError: Cannot read property 'bar' of undefined",
        "<stack trace>",
        " (debug) Stopping composite service...",
        " (debug) Stopping service 'second'...",
        " (debug) Stopped service 'second'",
        " (debug) Stopping service 'first'...",
        " (debug) Stopped service 'first'",
        " (debug) Stopped composite service",
        "",
        "",
      ]
    `)
  })
  it('crashes gracefully on error from onCrash *while* starting up', async () => {
    const script = getScript(`
      config.services.second.command = ['node', '-e', 'console.log("Crashing")'];
      config.services.second.onCrash = ctx => {
        console.log('isServiceReady:', ctx.isServiceReady)
        throw new Error('Crash')
      };
    `)
    proc = new CompositeProcess(script)
    await proc.ended
    const output = redactStackTraces(redactConfigDump(proc.flushOutput()))
    expect(output).toMatchInlineSnapshot(`
      Array [
        "<config dump>",
        " (debug) Starting composite service...",
        " (debug) Starting service 'first'...",
        "first | Started 🚀",
        " (debug) Started service 'first'",
        " (debug) Starting service 'second'...",
        "second | Crashing",
        " (info) Service 'second' crashed",
        "isServiceReady: false",
        " (error) Fatal error: In \`onCrash\` function for service second: Error: Crash",
        "<stack trace>",
        " (debug) Stopping composite service...",
        " (debug) Stopping service 'first'...",
        " (debug) Stopped service 'first'",
        " (debug) Stopped composite service",
        "",
        "",
      ]
    `)
  })
  it('crashes gracefully on error from onCrash *after* starting up', async () => {
    const script = getScript(`
      config.services.second.dependencies = []
      config.services.second.onCrash = ctx => {
        console.log('isServiceReady:', ctx.isServiceReady)
        throw new Error('Crash')
      };
      // stop after third stops, for consistent output we can snapshot
      config.services.first.env.STOP_DELAY = 250;
    `)
    proc = await new CompositeProcess(script).start()
    proc.flushOutput()
    expect(await fetchText('http://localhost:8002/?crash')).toBe('crashing')
    await proc.ended
    let output = redactStackTraces(proc.flushOutput())
    expect(output).toMatchInlineSnapshot(`
      Array [
        "second | Crashing",
        " (info) Service 'second' crashed",
        "isServiceReady: true",
        " (error) Fatal error: In \`onCrash\` function for service second: Error: Crash",
        "<stack trace>",
        " (debug) Stopping composite service...",
        " (debug) Stopping service 'third'...",
        " (debug) Stopped service 'third'",
        " (debug) Stopping service 'first'...",
        " (debug) Stopped service 'first'",
        " (debug) Stopped composite service",
        "",
        "",
      ]
    `)
  })
  it('restarts after calling onCrash without error', async () => {
    const script = getScript(`
      config.services.second.dependencies = [];
      config.services.second.logTailLength = 1;
      config.services.second.minimumRestartDelay = 0;
      config.services.second.onCrash = async ctx => {
        const tests = [
          'ctx.isServiceReady === true',
          'typeof ctx.crash === "object"',
          'Array.isArray(ctx.crashes)',
          'ctx.crashes.length >= 1',
          'ctx.crashes.slice(-1)[0] === ctx.crash',
          'ctx.crashes.every(crash => crash.date instanceof Date)',
          'ctx.crashes.every(crash => Array.isArray(crash.logTail))',
        ];
        for (const test of tests) {
          let ok;
          try { ok = eval(test) } catch (e) {}
          if (!ok) console.log('Failed test:', test);
        }
        console.log('number of crashes:', ctx.crashes.length);
        console.log('crash logTail:', JSON.stringify(ctx.crash.logTail));
        console.log('Handling crash...');
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('Done handling crash');
      };
    `)
    proc = await new CompositeProcess(script).start()
    proc.flushOutput()

    // crash once
    expect(await fetchText('http://localhost:8002/?crash')).toBe('crashing')
    // allow time for restart
    await delay(500)
    // make sure it restarted
    expect(await fetchText('http://localhost:8002/')).toBe('second')
    // correct output for 1st crash
    expect(proc.flushOutput()).toMatchInlineSnapshot(`
      Array [
        "second | Crashing",
        " (info) Service 'second' crashed",
        "number of crashes: 1",
        "crash logTail: [\\"Crashing\\\\n\\"]",
        "Handling crash...",
        "Done handling crash",
        " (info) Restarting service 'second'",
        "second | Started 🚀",
      ]
    `)

    // crash again
    expect(await fetchText('http://localhost:8002/?crash')).toBe('crashing')
    // allow time for restart again
    await delay(500)
    // make sure it restarted again
    expect(await fetchText('http://localhost:8002/')).toBe('second')
    // correct output for 2nd crash
    expect(proc.flushOutput()).toMatchInlineSnapshot(`
      Array [
        "second | Crashing",
        " (info) Service 'second' crashed",
        "number of crashes: 2",
        "crash logTail: [\\"Crashing\\\\n\\"]",
        "Handling crash...",
        "Done handling crash",
        " (info) Restarting service 'second'",
        "second | Started 🚀",
      ]
    `)
  })
})
