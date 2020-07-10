import { CompositeProcess } from './helpers/composite-process'
import { redactEscapedCwdInstances, redactStackTraces } from './helpers/redact'
import { fetchStatusAndText, fetchText } from './helpers/fetch'

function getScript(customCode = '') {
  return `
    const { onceOutputLineIs, configureHttpGateway, startCompositeService } = require('.');
    const config = {
      services: {
        api: {
          command: 'node test/integration/fixtures/http-service.js',
          env: { PORT: 8000, RESPONSE_TEXT: 'api' },
          ready: ctx => onceOutputLineIs(ctx.output, 'Started 🚀\\n'),
        },
        web: {
          dependencies: ['api'],
          command: ['node', 'test/integration/fixtures/http-service.js'],
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
    ${customCode};
    startCompositeService(config);
  `
}

async function fetchCrash() {
  expect(
    await fetchStatusAndText('http://localhost:8080/?crash')
  ).toStrictEqual({
    status: 504,
    text: 'Error occured while trying to proxy to: localhost:8080/?crash',
  })
}

function filterGatewayErrorLines(lines: string[], count: number) {
  const isGatewayErrorLine = (line: string) =>
    line.startsWith('gateway | [HPM] Error ')

  void count
  /*
    TODO: commented-out assertion fails only on ubuntu + node v10 ?
        https://github.com/zenflow/composite-service/actions/runs/165147632
        https://github.com/zenflow/composite-service/actions/runs/165137341
    When this function is called in "crashes gracefully on error from onCrash *after* starting up"
      lines.filter(isGatewayErrorLine) is empty array.
  */
  /* const expectedLine =
    'gateway | [HPM] Error occurred while trying to proxy request /?crash from localhost:8080 to http://localhost:8001 (ECONNRESET) (https://nodejs.org/api/errors.html#errors_common_system_errors)'
  expect(lines.filter(isGatewayErrorLine)).toStrictEqual(
    Array.from({ length: count }, () => expectedLine)
  ) */

  return lines.filter(line => !isGatewayErrorLine(line))
}

describe('crashing', () => {
  jest.setTimeout(process.platform === 'win32' ? 45000 : 15000)
  let proc: CompositeProcess | undefined
  afterEach(async () => {
    if (proc) await proc.end()
  })
  it('crashes before starting on error validating configuration', async () => {
    const script = getScript(`
      config.services.gateway.dependencies.push('this_dependency_does_not_exist');
    `)
    proc = new CompositeProcess(script)
    await proc.ended
    expect(redactEscapedCwdInstances(redactStackTraces(proc.flushOutput())))
      .toMatchInlineSnapshot(`
      Array [
        "debug: config = {",
        "debug:   \\"services\\": {",
        "debug:     \\"api\\": {",
        "debug:       \\"command\\": \\"node test/integration/fixtures/http-service.js\\",",
        "debug:       \\"env\\": {",
        "debug:         \\"PORT\\": 8000,",
        "debug:         \\"RESPONSE_TEXT\\": \\"api\\"",
        "debug:       },",
        "debug:       \\"ready\\": ctx => onceOutputLineIs(ctx.output, 'Started 🚀\\\\n')",
        "debug:     },",
        "debug:     \\"web\\": {",
        "debug:       \\"dependencies\\": [",
        "debug:         \\"api\\"",
        "debug:       ],",
        "debug:       \\"command\\": [",
        "debug:         \\"node\\",",
        "debug:         \\"test/integration/fixtures/http-service.js\\"",
        "debug:       ],",
        "debug:       \\"env\\": {",
        "debug:         \\"PORT\\": 8001,",
        "debug:         \\"RESPONSE_TEXT\\": \\"web\\"",
        "debug:       },",
        "debug:       \\"ready\\": ctx => onceOutputLineIs(ctx.output, 'Started 🚀\\\\n')",
        "debug:     },",
        "debug:     \\"gateway\\": {",
        "debug:       \\"dependencies\\": [",
        "debug:         \\"api\\",",
        "debug:         \\"web\\",",
        "debug:         \\"this_dependency_does_not_exist\\"",
        "debug:       ],",
        "debug:       \\"command\\": [",
        "debug:         \\"node\\",",
        "debug:         \\"<cwd>dist/http-gateway-server.js\\"",
        "debug:       ],",
        "debug:       \\"env\\": {",
        "debug:         \\"HOST\\": \\"0.0.0.0\\",",
        "debug:         \\"PORT\\": \\"8080\\",",
        "debug:         \\"PROXIES\\": \\"[[\\\\\\"/api\\\\\\",{\\\\\\"target\\\\\\":\\\\\\"http://localhost:8000\\\\\\"}],[\\\\\\"/\\\\\\",{\\\\\\"target\\\\\\":\\\\\\"http://localhost:8001\\\\\\"}]]\\"",
        "debug:       },",
        "debug:       \\"ready\\": ctx => onceOutputLineIncludes(ctx.output, 'Listening @ http://')",
        "debug:     }",
        "debug:   }",
        "debug: }",
        "error: ConfigValidationError: config.services.gateway.dependencies: Contains invalid service id 'this_dependency_does_not_exist'",
        "<stack trace>",
        "",
        "",
      ]
    `)
  })
  it('crashes gracefully on error starting process', async () => {
    const script = getScript(`
      config.services.web.command = 'this_command_does_not_exist';
    `)
    proc = new CompositeProcess(script)
    await proc.ended
    expect(redactStackTraces(proc.flushOutput())).toMatchInlineSnapshot(`
      Array [
        "info: Starting composite service...",
        "info: Starting service 'api'...",
        "api     | Started 🚀",
        "info: Started service 'api'",
        "info: Starting service 'web'...",
        "error: Error in 'web': Error starting process: Error: spawn this_command_does_not_exist ENOENT",
        "<stack trace>",
        "info: Stopping composite service...",
        "info: Stopping service 'api'...",
        "api     | ",
        "api     | ",
        "info: Stopped service 'api'",
        "info: Stopped composite service",
        "",
        "",
      ]
    `)
  })
  it('crashes gracefully on error from ready', async () => {
    const script = getScript(`
      config.services.web.ready = () => global.foo.bar();
    `)
    proc = new CompositeProcess(script)
    await proc.ended
    expect(redactStackTraces(proc.flushOutput())).toMatchInlineSnapshot(`
      Array [
        "info: Starting composite service...",
        "info: Starting service 'api'...",
        "api     | Started 🚀",
        "info: Started service 'api'",
        "info: Starting service 'web'...",
        "error: Error in 'web': Error from ready function: TypeError: Cannot read property 'bar' of undefined",
        "<stack trace>",
        "info: Stopping composite service...",
        "info: Stopping service 'web'...",
        "web     | ",
        "web     | ",
        "info: Stopped service 'web'",
        "info: Stopping service 'api'...",
        "api     | ",
        "api     | ",
        "info: Stopped service 'api'",
        "info: Stopped composite service",
        "",
        "",
      ]
    `)
  })
  it('crashes gracefully on error from onCrash *while* starting up', async () => {
    const script = getScript(`
      config.services.web.command = ['node', '-e', 'console.log("Crashing")'];
      config.services.web.onCrash = () => {
        throw new Error('Crash')
      };
    `)
    proc = new CompositeProcess(script)
    await proc.ended
    expect(redactStackTraces(proc.flushOutput())).toMatchInlineSnapshot(`
      Array [
        "info: Starting composite service...",
        "info: Starting service 'api'...",
        "api     | Started 🚀",
        "info: Started service 'api'",
        "info: Starting service 'web'...",
        "web     | Crashing",
        "web     | ",
        "web     | ",
        "info: Service 'web' crashed",
        "error: Error in 'web': Error from onCrash function: Error: Crash",
        "<stack trace>",
        "info: Stopping composite service...",
        "info: Stopping service 'api'...",
        "api     | ",
        "api     | ",
        "info: Stopped service 'api'",
        "info: Stopped composite service",
        "",
        "",
      ]
    `)
  })
  it('crashes gracefully on error from onCrash *after* starting up', async () => {
    const script = getScript(`
      config.services.web.dependencies = []
      config.services.web.onCrash = () => {
        throw new Error('Crash')
      };
      // stop after gateway stops, for consistent output we can snapshot
      config.services.api.env.STOP_DELAY = 250;
    `)
    proc = await new CompositeProcess(script).start()
    proc.flushOutput()
    await fetchCrash()
    await proc.ended
    let output = redactStackTraces(proc.flushOutput())
    output = filterGatewayErrorLines(output, 1)
    expect(output).toMatchInlineSnapshot(`
      Array [
        "web     | Crashing",
        "web     | ",
        "web     | ",
        "info: Service 'web' crashed",
        "error: Error in 'web': Error from onCrash function: Error: Crash",
        "<stack trace>",
        "info: Stopping composite service...",
        "info: Stopping service 'gateway'...",
        "gateway | ",
        "gateway | ",
        "info: Stopped service 'gateway'",
        "info: Stopping service 'api'...",
        "api     | ",
        "api     | ",
        "info: Stopped service 'api'",
        "info: Stopped composite service",
        "",
        "",
      ]
    `)
  })
  it('restarts after calling onCrash successfully', async () => {
    const script = getScript(`
      config.services.web.dependencies = [];
      config.services.web.logTailLength = 2;
      config.services.web.minimumRestartDelay = 0;
      config.services.web.onCrash = async ctx => {
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
    await fetchCrash()
    // allow time for restart
    await new Promise(resolve => setTimeout(resolve, 250))
    // make sure it restarted
    expect(await fetchText('http://localhost:8080/')).toBe('web')
    // correct output for 1st crash
    expect(filterGatewayErrorLines(proc.flushOutput(), 1))
      .toMatchInlineSnapshot(`
      Array [
        "web     | Crashing",
        "web     | ",
        "web     | ",
        "info: Service 'web' crashed",
        "number of crashes: 1",
        "crash logTail: [\\"\\\\n\\",\\"\\\\n\\"]",
        "Handling crash...",
        "Done handling crash",
        "info: Restarting service 'web'",
        "web     | Started 🚀",
      ]
    `)

    // crash again
    await fetchCrash()
    // allow time for restart again
    await new Promise(resolve => setTimeout(resolve, 250))
    // make sure it restarted again
    expect(await fetchText('http://localhost:8080/')).toBe('web')
    // correct output for 2nd crash
    expect(filterGatewayErrorLines(proc.flushOutput(), 1))
      .toMatchInlineSnapshot(`
      Array [
        "web     | Crashing",
        "web     | ",
        "web     | ",
        "info: Service 'web' crashed",
        "number of crashes: 2",
        "crash logTail: [\\"\\\\n\\",\\"\\\\n\\"]",
        "Handling crash...",
        "Done handling crash",
        "info: Restarting service 'web'",
        "web     | Started 🚀",
      ]
    `)
  })
})
