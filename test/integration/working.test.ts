import { CompositeProcess } from './helpers/composite-process'
import { redactConfigDump } from './helpers/redact'

function getScript() {
  return `
    const { startCompositeService } = require('.');
    const config = {
      logLevel: 'debug',
      gracefulShutdown: true,
      services: {
        first: {
          cwd: 'test/integration/fixtures',
          command: ['node', 'http-service.js'],
          env: { PORT: 8001, RESPONSE_TEXT: 'first', START_DELAY: 500, STOP_DELAY: 500 },
          ready: ctx => ctx.onceTcpPortUsed(8001),
        },
        second: {
          command: 'node test/integration/fixtures/http-service.js',
          env: { PORT: 8002, RESPONSE_TEXT: 'second' },
          ready: ctx => ctx.onceOutputLineIncludes('🚀'),
        },
        third: {
          dependencies: ['first', 'second'],
          command: 'node test/integration/fixtures/http-service.js',
          env: { PORT: 8003, RESPONSE_TEXT: 'third' },
          ready: ctx => ctx.onceOutputLine(line => line === 'Started 🚀'),
        },
      },
    };
    startCompositeService(config);
  `
}

describe('working', () => {
  jest.setTimeout(process.platform === 'win32' ? 30000 : 10000)
  let proc: CompositeProcess | undefined
  afterEach(async () => {
    if (proc) await proc.end()
  })
  it('works', async () => {
    proc = await new CompositeProcess(getScript()).start()
    expect(redactConfigDump(proc.flushOutput())).toMatchInlineSnapshot(`
      Array [
        "<config dump>",
        " (debug) Starting composite service...",
        " (debug) Starting service 'first'...",
        " (debug) Starting service 'second'...",
        "second | Started 🚀",
        " (debug) Started service 'second'",
        "first | Started 🚀",
        " (debug) Started service 'first'",
        " (debug) Starting service 'third'...",
        "third | Started 🚀",
        " (debug) Started service 'third'",
        " (debug) Started composite service",
      ]
    `)
    expect(proc.flushOutput()).toStrictEqual([])
    await proc.end()
    if (process.platform === 'win32') {
      // Windows doesn't really support gracefully terminating processes :(
      expect(proc.flushOutput()).toStrictEqual(['', ''])
    } else {
      expect(proc.flushOutput()).toMatchInlineSnapshot(`
        Array [
          " (info) Received shutdown signal (SIGINT)",
          " (debug) Stopping composite service...",
          " (debug) Stopping service 'third'...",
          " (debug) Stopped service 'third'",
          " (debug) Stopping service 'first'...",
          " (debug) Stopping service 'second'...",
          " (debug) Stopped service 'second'",
          " (debug) Stopped service 'first'",
          " (debug) Stopped composite service",
          "",
          "",
        ]
      `)
    }
  })
})
