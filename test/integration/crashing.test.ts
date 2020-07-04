import { CompositeProcess } from './helpers/composite-process'
import { getBoilerScript } from './helpers/getBoilerScript'
import { redactStackTrace } from './helpers/redactStackTrace'

describe('crashing', () => {
  jest.setTimeout(process.platform === 'win32' ? 15000 : 5000)
  let proc: CompositeProcess | undefined
  afterEach(async () => {
    if (proc) await proc.end()
  })
  it('crashes before starting on error validating configuration', async () => {
    const script = getBoilerScript(`
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
    const script = getBoilerScript(`
      config.services.web.dependencies = ['api']
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
    const script = getBoilerScript(`
      config.services.web.dependencies = ['api'];
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
  it('crashes gracefully on error from handleCrash *while* starting up', async () => {
    const script = getBoilerScript(`
      config.services.web.dependencies = ['api'];
      config.services.web.env.CRASH_BEFORE_STARTED = 1
      config.services.web.handleCrash = () => {
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
        "web     | ",
        "web     | ",
        "Service 'web' crashed",
        "Error in 'web': Error from handleCrash function: Error: Crash",
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
  it('crashes gracefully on error from handleCrash *after* starting up', async () => {
    const script = getBoilerScript(`
      config.services.api.env.STOP_DELAY = 250;
      Object.assign(config.services.web.env, {
        CRASH_AFTER_STARTED: 1,
        CRASH_DELAY: 1000,
      });
      config.services.web.handleCrash = () => {
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
        "Error in 'web': Error from handleCrash function: Error: Crash",
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
