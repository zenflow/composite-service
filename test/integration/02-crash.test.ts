import { CompositeProcess } from './helpers/composite-process'

const getScript = (customCode: string) => {
  return `
    const { onceOutputLineIncludes, startCompositeService, onceTimeout } = require('.');
    const command = 'node test/integration/fixtures/noop-service.js';
    const ready = ctx => onceOutputLineIncludes(ctx.output, '🚀');
    const config = {
      services: {
        first: { command, ready },
        second: { command, ready },
        third: {
          dependencies: ['first', 'second'],
          command,
          ready: () => onceTimeout(0)
        },
      },
    };
    ${customCode};
    startCompositeService(config);
  `
}

describe('crash', () => {
  jest.setTimeout(process.platform === 'win32' ? 15000 : 5000)
  let proc: CompositeProcess | undefined
  afterEach(async () => {
    if (proc) await proc.end()
  })
  describe('crashes when a composed service crashes', () => {
    it('before any service is started', async () => {
      const script = getScript(`
        config.services.first.env = { CRASH_BEFORE_STARTED: 1 };
        config.services.second.env = { START_DELAY: 5000 };
      `)
      proc = new CompositeProcess(script)
      await proc.ended
      expect(proc.flushOutput()).toMatchInlineSnapshot(`
        Array [
          "Starting composite service...",
          "Starting service 'first'...",
          "Starting service 'second'...",
          "first  | ",
          "first  | ",
          "Error starting service 'first': Process exited without becoming ready",
          "Stopping composite service...",
          "Stopping service 'second'...",
          "second | ",
          "second | ",
          "Stopped service 'second'",
          "Stopped composite service",
          "",
          "",
        ]
      `)
    })
    it('before that service is started & after other service is started', async () => {
      const script = getScript(`
        config.services.first.env = { CRASH_BEFORE_STARTED: 1, CRASH_DELAY: 500 };
      `)
      proc = new CompositeProcess(script)
      await proc.ended
      expect(proc.flushOutput()).toMatchInlineSnapshot(`
        Array [
          "Starting composite service...",
          "Starting service 'first'...",
          "Starting service 'second'...",
          "second | Started 🚀",
          "Started service 'second'",
          "first  | ",
          "first  | ",
          "Error starting service 'first': Process exited without becoming ready",
          "Stopping composite service...",
          "Stopping service 'second'...",
          "second | ",
          "second | ",
          "Stopped service 'second'",
          "Stopped composite service",
          "",
          "",
        ]
      `)
    })
    it.skip('after that service is started & before other service is started', async () => {
      const script = getScript(`
        config.services.first.env = { CRASH_AFTER_STARTED: 1, CRASH_DELAY: 500 };
        config.services.second.env = { START_DELAY: 5000 };
      `)
      proc = new CompositeProcess(script)
      await proc.ended
      expect(proc.flushOutput()).toMatchInlineSnapshot(`
        Array [
          "Starting composite service...",
          "Starting service 'first'...",
          "Starting service 'second'...",
          "first  | Started 🚀",
          "Started service 'first'",
          "first  | ",
          "first  | ",
          "Process for service 'first' exited",
          "Stopping composite service...",
          "Stopping service 'second'...",
          "second | ",
          "second | ",
          "Stopped service 'second'",
          "Stopped composite service",
          "",
          "",
        ]
      `)
    })
    it.skip('after all services are started', async () => {
      const script = getScript(`
        config.services.first.env = { CRASH_AFTER_STARTED: 1, CRASH_DELAY: 1000 };
        config.services.second.env = { START_DELAY: 500, STOP_DELAY: 500 };
      `)
      proc = new CompositeProcess(script)
      await proc.ended
      expect(proc.flushOutput()).toMatchInlineSnapshot(`
        Array [
          "Starting composite service...",
          "Starting service 'first'...",
          "Starting service 'second'...",
          "first  | Started 🚀",
          "Started service 'first'",
          "second | Started 🚀",
          "Started service 'second'",
          "Starting service 'third'...",
          "third  | Started 🚀",
          "Started service 'third'",
          "Started composite service",
          "first  | ",
          "first  | ",
          "Process for service 'first' exited",
          "Stopping composite service...",
          "Stopping service 'third'...",
          "third  | ",
          "third  | ",
          "Stopped service 'third'",
          "Stopping service 'second'...",
          "second | ",
          "second | ",
          "Stopped service 'second'",
          "Stopped composite service",
          "",
          "",
        ]
      `)
    })
  })
  it('crashes when given invalid command', async () => {
    const script = getScript(`
      config.services.second.dependencies = ['first']
      config.services.second.command = 'this_command_does_not_exist'
    `)
    proc = new CompositeProcess(script)
    await proc.ended
    expect(proc.flushOutput()).toMatchInlineSnapshot(`
      Array [
        "Starting composite service...",
        "Starting service 'first'...",
        "first  | Started 🚀",
        "Started service 'first'",
        "Starting service 'second'...",
        "Error starting service 'second': Error spawning process: spawn this_command_does_not_exist ENOENT",
        "Stopping composite service...",
        "Stopping service 'first'...",
        "first  | ",
        "first  | ",
        "Stopped service 'first'",
        "Stopped composite service",
        "",
        "",
      ]
    `)
  })
  it('crashes when `ready` throws error', async () => {
    const script = getScript(`
      config.services.second.dependencies = ['first']
      config.services.second.ready = () => global.foo.bar()
    `)
    proc = new CompositeProcess(script)
    await proc.ended
    const output = proc.flushOutput()

    // redact stack trace lines for snapshot since the file paths in it will vary from system to system
    const isStackTraceLine = (line: string) => line.startsWith('    at ')
    const stackTraceStart = output.findIndex(isStackTraceLine)
    expect(stackTraceStart).toBeGreaterThan(-1)
    const stackTraceLength = output
      .slice(stackTraceStart)
      .findIndex((line: string) => !isStackTraceLine(line))
    expect(stackTraceLength).toBeGreaterThan(-1)
    output.splice(stackTraceStart, stackTraceLength, '--- stack trace ---')

    expect(output).toMatchInlineSnapshot(`
      Array [
        "Starting composite service...",
        "Starting service 'first'...",
        "first  | Started 🚀",
        "Started service 'first'",
        "Starting service 'second'...",
        "Error starting service 'second': Error waiting to be ready: TypeError: Cannot read property 'bar' of undefined",
        "--- stack trace ---",
        "Stopping composite service...",
        "Stopping service 'second'...",
        "second | ",
        "second | ",
        "Stopped service 'second'",
        "Stopping service 'first'...",
        "first  | ",
        "first  | ",
        "Stopped service 'first'",
        "Stopped composite service",
        "",
        "",
      ]
    `)
  })
})
