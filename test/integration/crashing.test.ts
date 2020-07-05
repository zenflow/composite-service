import { CompositeProcess } from './helpers/composite-process'
import { redactStackTrace } from './helpers/redactStackTrace'

function getScript(customCode = '') {
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
  jest.setTimeout(process.platform === 'win32' ? 15000 : 5000)
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
    expect(redactStackTrace(proc.flushOutput())).toMatchInlineSnapshot(`
      Array [
        "ConfigValidationError: config.services.gateway.dependencies: Contains invalid service id 'this_dependency_does_not_exist'",
        "--- stack trace ---",
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
    expect(redactStackTrace(proc.flushOutput())).toMatchInlineSnapshot(`
      Array [
        "Starting composite service...",
        "Starting service 'api'...",
        "api     | Started 🚀",
        "Started service 'api'",
        "Starting service 'web'...",
        "Error in 'web': Error starting process: Error: spawn this_command_does_not_exist ENOENT",
        "--- stack trace ---",
        "Stopping composite service...",
        "Stopping service 'api'...",
        "api     | ",
        "api     | ",
        "Stopped service 'api'",
        "Stopped composite service",
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
    expect(redactStackTrace(proc.flushOutput())).toMatchInlineSnapshot(`
      Array [
        "Starting composite service...",
        "Starting service 'api'...",
        "api     | Started 🚀",
        "Started service 'api'",
        "Starting service 'web'...",
        "Error in 'web': Error from ready function: TypeError: Cannot read property 'bar' of undefined",
        "--- stack trace ---",
        "Stopping composite service...",
        "Stopping service 'web'...",
        "web     | ",
        "web     | ",
        "Stopped service 'web'",
        "Stopping service 'api'...",
        "api     | ",
        "api     | ",
        "Stopped service 'api'",
        "Stopped composite service",
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
    expect(redactStackTrace(proc.flushOutput())).toMatchInlineSnapshot(`
      Array [
        "Starting composite service...",
        "Starting service 'api'...",
        "api     | Started 🚀",
        "Started service 'api'",
        "Starting service 'web'...",
        "web     | Crashing",
        "web     | ",
        "web     | ",
        "Service 'web' crashed",
        "Error in 'web': Error from onCrash function: Error: Crash",
        "--- stack trace ---",
        "Stopping composite service...",
        "Stopping service 'api'...",
        "api     | ",
        "api     | ",
        "Stopped service 'api'",
        "Stopped composite service",
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
    expect(redactStackTrace(proc.flushOutput())).toMatchInlineSnapshot(`
      Array [
        "web     | ",
        "web     | ",
        "Service 'web' crashed",
        "Error in 'web': Error from onCrash function: Error: Crash",
        "--- stack trace ---",
        "Stopping composite service...",
        "Stopping service 'gateway'...",
        "gateway | ",
        "gateway | ",
        "Stopped service 'gateway'",
        "Stopping service 'api'...",
        "api     | ",
        "api     | ",
        "Stopped service 'api'",
        "Stopped composite service",
        "",
        "",
      ]
    `)
  })
})
