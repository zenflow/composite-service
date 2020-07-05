import { CompositeProcess } from './helpers/composite-process'
import { fetchStatusAndText, fetchText } from './helpers/fetch'

export function getScript() {
  return `
    const { onceOutputLineIs, onceTcpPortUsed, configureHttpGateway, startCompositeService } = require('.');
    const config = {
      services: {
        api: {
          command: 'node test/integration/fixtures/http-service.js',
          env: { PORT: 8000, RESPONSE_TEXT: 'api' },
          ready: ctx => onceTcpPortUsed(8000),
        },
        web: {
          command: ['node', 'test/integration/fixtures/http-service.js'],
          env: { PORT: 8001, RESPONSE_TEXT: 'web' },
          ready: ctx => onceOutputLineIs(ctx.output, 'Started 🚀\\n'),
          logTailLength: 3,
          minimumRestartDelay: 0,
          async onCrash (ctx) {
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
          },
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

describe('crash handling', () => {
  jest.setTimeout(process.platform === 'win32' ? 30000 : 10000)
  let proc: CompositeProcess | undefined
  afterEach(async () => {
    if (proc) await proc.end()
  })
  it('calls and waits for `onCrash` before restarting service', async () => {
    proc = await new CompositeProcess(getScript()).start()
    proc.flushOutput()
    // crash once
    expect(
      await fetchStatusAndText('http://localhost:8080/?crash')
    ).toStrictEqual({
      status: 504,
      text: 'Error occured while trying to proxy to: localhost:8080/?crash',
    })
    // allow time for restart
    await new Promise(resolve => setTimeout(resolve, 500))
    // make sure it restarted
    expect(await fetchText('http://localhost:8080/')).toBe('web')
    // crash again
    expect(
      await fetchStatusAndText('http://localhost:8080/?crash')
    ).toStrictEqual({
      status: 504,
      text: 'Error occured while trying to proxy to: localhost:8080/?crash',
    })
    // allow time for restart again
    await new Promise(resolve => setTimeout(resolve, 500))
    // make sure it restarted again
    expect(await fetchText('http://localhost:8080/')).toBe('web')
    const output = proc.flushOutput()
    const gatewayOutput = output.filter(line => line.startsWith('gateway | '))
    const otherOutput = output.filter(line => !line.startsWith('gateway | '))
    expect(gatewayOutput).toMatchInlineSnapshot(`
      Array [
        "gateway | [HPM] Error occurred while trying to proxy request /?crash from localhost:8080 to http://localhost:8001 (ECONNRESET) (https://nodejs.org/api/errors.html#errors_common_system_errors)",
        "gateway | [HPM] Error occurred while trying to proxy request /?crash from localhost:8080 to http://localhost:8001 (ECONNRESET) (https://nodejs.org/api/errors.html#errors_common_system_errors)",
      ]
    `)
    expect(otherOutput).toMatchInlineSnapshot(`
      Array [
        "web     | Crashing",
        "web     | ",
        "web     | ",
        "Service 'web' crashed",
        "number of crashes: 1",
        "crash logTail: [\\"Crashing\\\\n\\",\\"\\\\n\\",\\"\\\\n\\"]",
        "Handling crash...",
        "Done handling crash",
        "Restarting service 'web'",
        "web     | Started 🚀",
        "web     | Crashing",
        "web     | ",
        "web     | ",
        "Service 'web' crashed",
        "number of crashes: 2",
        "crash logTail: [\\"Crashing\\\\n\\",\\"\\\\n\\",\\"\\\\n\\"]",
        "Handling crash...",
        "Done handling crash",
        "Restarting service 'web'",
        "web     | Started 🚀",
      ]
    `)
  })
})
