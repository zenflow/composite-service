import { CompositeProcess } from './helpers/composite-process'
import { fetchText } from './helpers/fetch'
import { redactConfigDump } from './helpers/redact'

function getScript() {
  return `
    const { onceOutputLineIs, onceTcpPortUsed, configureHttpGateway, startCompositeService } = require('.');
    const config = {
      logLevel: 'debug',
      gracefulShutdown: true,
      services: {
        api: {
          command: 'node test/integration/fixtures/http-service.js',
          env: { PORT: 8000, RESPONSE_TEXT: 'api', START_DELAY: 500, STOP_DELAY: 500 },
          ready: ctx => onceTcpPortUsed(8000),
        },
        web: {
          cwd: 'test/integration/fixtures',
          command: ['node', 'http-service.js'],
          env: { PORT: 8001, RESPONSE_TEXT: 'web' },
          ready: ctx => onceOutputLineIs(ctx.output, 'Started 🚀\\n'),
        },
        gateway: configureHttpGateway({
          dependencies: ['api', 'web'],
          port: 8080,
          proxies: [
            ['/api', { target: 'http://localhost:8000' }],
            ['/', { target: 'http://localhost:8001' }],
          ],
        }),
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
        " (debug) Starting service 'api'...",
        " (debug) Starting service 'web'...",
        "web | Started 🚀",
        " (debug) Started service 'web'",
        "api | Started 🚀",
        " (debug) Started service 'api'",
        " (debug) Starting service 'gateway'...",
        "gateway | [HPM] Proxy created: /api  -> http://localhost:8000",
        "gateway | [HPM] Proxy created: /  -> http://localhost:8001",
        "gateway | Listening @ http://0.0.0.0:8080",
        " (debug) Started service 'gateway'",
        " (debug) Started composite service",
      ]
    `)
    expect(await fetchText('http://localhost:8080/api')).toBe('api')
    expect(await fetchText('http://localhost:8080/api/foo')).toBe('api')
    expect(await fetchText('http://localhost:8080/')).toBe('web')
    expect(await fetchText('http://localhost:8080/foo')).toBe('web')
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
          " (debug) Stopping service 'gateway'...",
          " (debug) Stopped service 'gateway'",
          " (debug) Stopping service 'api'...",
          " (debug) Stopping service 'web'...",
          " (debug) Stopped service 'web'",
          " (debug) Stopped service 'api'",
          " (debug) Stopped composite service",
          "",
          "",
        ]
      `)
    }
  })
})
