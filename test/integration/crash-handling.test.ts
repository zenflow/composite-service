import fetch from 'node-fetch'
import { CompositeProcess } from './helpers/composite-process'
import { getBoilerScript } from './helpers/getBoilerScript'
import { fetchText } from './helpers/fetchText'

describe('crash handling', () => {
  jest.setTimeout(process.platform === 'win32' ? 30000 : 10000)
  let proc: CompositeProcess | undefined
  afterEach(async () => {
    if (proc) await proc.end()
  })
  it('calls and waits for `handleCrash` before restarting service', async () => {
    const script = getBoilerScript(`
      config.services.web.handleCrash = async ctx => {
        console.log('Handling crash...');
        const expressions = [
          'ctx.isServiceReady',
          'typeof ctx.crash',
          'Array.isArray(ctx.crashes)',
          'ctx.crashes.length',
          'ctx.crash === ctx.crashes[0]',
        ];
        for (const expression of expressions) {
          console.log(' -', expression, '=', eval(expression));
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('Done handling crash');
      };
    `)
    proc = await new CompositeProcess(script).start()
    proc.flushOutput()
    const firstResponse = await fetch('http://localhost:8080/?crash')
    expect(firstResponse.status).toBe(504)
    expect(await firstResponse.text()).toMatchInlineSnapshot(
      `"Error occured while trying to proxy to: localhost:8080/?crash"`
    )
    const secondResponse = await fetch('http://localhost:8080/')
    expect(secondResponse.status).toBe(504)
    expect(await secondResponse.text()).toMatchInlineSnapshot(
      `"Error occured while trying to proxy to: localhost:8080/"`
    )
    await new Promise(resolve => setTimeout(resolve, 500)) // allow time for restart
    expect(await fetchText('http://localhost:8080/')).toBe('web')
    expect(proc.flushOutput()).toMatchInlineSnapshot(`
      Array [
        "web     | ",
        "web     | ",
        "Service 'web' crashed",
        "Handling crash...",
        " - ctx.isServiceReady = true",
        " - typeof ctx.crash = object",
        " - Array.isArray(ctx.crashes) = true",
        " - ctx.crashes.length = 1",
        " - ctx.crash === ctx.crashes[0] = true",
        "gateway | [HPM] Error occurred while trying to proxy request /?crash from localhost:8080 to http://localhost:8001 (ECONNRESET) (https://nodejs.org/api/errors.html#errors_common_system_errors)",
        "gateway | [HPM] Error occurred while trying to proxy request / from localhost:8080 to http://localhost:8001 (ECONNREFUSED) (https://nodejs.org/api/errors.html#errors_common_system_errors)",
        "Done handling crash",
        "Restarting service 'web'...",
        "web     | Started 🚀",
        "Restarted service 'web'",
      ]
    `)
  })
})
