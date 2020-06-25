import { CompositeProcess } from './helpers/composite-process'
import { fetchText } from './helpers/fetchText'

const getScript = () => {
  return `
    const { onceOutputLineIs, oncePortUsed, configureHttpGatewayService, startCompositeService } = require('.');
    const command = 'node test/integration/fixtures/http-service.js';
    const config = {
      services: {
        api: {
          command,
          env: { PORT: 8000, RESPONSE_TEXT: 'api', START_DELAY: 500, STOP_DELAY: 500 },
          ready: ctx => onceOutputLineIs(ctx.output, 'Started 🚀\\n'),
        },
        web: {
          command,
          env: { PORT: 8001, RESPONSE_TEXT: 'web' },
          ready: ctx => oncePortUsed(8001),
        },
        gateway: configureHttpGatewayService({
          dependencies: ['api', 'web'],
          port: 3000,
          proxies: [
            { context: '/api', target: 'http://localhost:8000' },
            { context: '/', target: 'http://localhost:8001' },
          ],
        }),
      },
    };
    startCompositeService(config);
  `
}

describe('basic', () => {
  jest.setTimeout(process.platform === 'win32' ? 15000 : 5000)
  let proc: CompositeProcess | undefined
  afterEach(async () => {
    if (proc) await proc.end()
  })
  it('works', async () => {
    proc = await new CompositeProcess(getScript()).start()
    expect(proc.flushOutput()).toMatchInlineSnapshot(`
      Array [
        "Starting composite service...",
        "Starting service 'api'...",
        "Starting service 'web'...",
        "web     | Started 🚀",
        "Started service 'web'",
        "api     | Started 🚀",
        "Started service 'api'",
        "Starting service 'gateway'...",
        "gateway | [HPM] Proxy created: /api  -> http://localhost:8000",
        "gateway | [HPM] Proxy created: /  -> http://localhost:8001",
        "gateway | Listening @ http://0.0.0.0:3000",
        "Started service 'gateway'",
        "Started composite service",
      ]
    `)
    expect(await fetchText('http://localhost:3000/api')).toBe('api')
    expect(await fetchText('http://localhost:3000/api/foo')).toBe('api')
    expect(await fetchText('http://localhost:3000/')).toBe('web')
    expect(await fetchText('http://localhost:3000/foo')).toBe('web')
    expect(proc.flushOutput()).toStrictEqual([])
    await proc.end()
    if (process.platform === 'win32') {
      // Windows doesn't support gracefully terminating processes :(
      expect(proc.flushOutput()).toStrictEqual(['', ''])
    } else {
      expect(proc.flushOutput()).toMatchInlineSnapshot(`
        Array [
          "Received shutdown signal 'SIGINT'",
          "Stopping composite service...",
          "Stopping service 'gateway'...",
          "gateway | ",
          "gateway | ",
          "Stopped service 'gateway'",
          "Stopping service 'api'...",
          "Stopping service 'web'...",
          "web     | ",
          "web     | ",
          "Stopped service 'web'",
          "api     | ",
          "api     | ",
          "Stopped service 'api'",
          "Stopped composite service",
          "",
          "",
        ]
      `)
    }
  })
})
