import { CompositeProcess } from './helpers/composite-process'
import { fetchText } from './helpers/fetchText'
import { getBoilerScript } from './helpers/getBoilerScript'

describe('working', () => {
  jest.setTimeout(process.platform === 'win32' ? 30000 : 10000)
  let proc: CompositeProcess | undefined
  afterEach(async () => {
    if (proc) await proc.end()
  })
  it('works', async () => {
    const script = getBoilerScript(`
      Object.assign(config.services.api.env, {
        START_DELAY: 500,
        STOP_DELAY: 500,
      })
    `)
    proc = await new CompositeProcess(script).start()
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
        "gateway | Listening @ http://0.0.0.0:8080",
        "Started service 'gateway'",
        "Started composite service",
      ]
    `)
    expect(await fetchText('http://localhost:8080/api')).toBe('api')
    expect(await fetchText('http://localhost:8080/api/foo')).toBe('api')
    expect(await fetchText('http://localhost:8080/')).toBe('web')
    expect(await fetchText('http://localhost:8080/foo')).toBe('web')
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
