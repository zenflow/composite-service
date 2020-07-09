import { CompositeProcess } from './helpers/composite-process'
import { redactEscapedCwdInstances, redactStackTraces } from './helpers/redact'

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

describe('crashing', () => {
  jest.setTimeout(process.platform === 'win32' ? 30000 : 10000)
  let proc: CompositeProcess | undefined
  afterEach(async () => {
    if (proc) await proc.end()
  })
  it('crashes before starting on error validating configuration', async () => {
    const script = getScript(`
      config.services.gateway.dependencies.push('this_dependency_does_not_exist')
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
      config.services.web.command = 'this_command_does_not_exist'
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
  it('crashes gracefully on error from `ready`', async () => {
    const script = getScript(`
      config.services.web.ready = () => global.foo.bar()
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
      config.services.web.env.CRASH_BEFORE_STARTED = 1
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
      config.services.api.env.STOP_DELAY = 250;
      Object.assign(config.services.web.env, {
        CRASH_AFTER_STARTED: 1,
        CRASH_DELAY: 500,
      });
      config.services.web.onCrash = () => {
        throw new Error('Crash')
      };
    `)
    proc = await new CompositeProcess(script).start()
    proc.flushOutput()
    await proc.ended
    expect(redactStackTraces(proc.flushOutput())).toMatchInlineSnapshot(`
      Array [
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
})
