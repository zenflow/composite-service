import { CompositeProcess } from './helpers/composite-process'
import { redactStackTraces } from './helpers/redactStackTraces'

describe('process', () => {
  jest.setTimeout(process.platform === 'win32' ? 15000 : 5000)
  let proc: CompositeProcess | undefined
  afterEach(async () => {
    if (proc) await proc.end()
  })
  it('Uses binaries of locally installed packages', async () => {
    const script = `
      const { startCompositeService } = require('.');
      startCompositeService({
        services: {
          only: {
            command: 'tsdx --help',
            onCrash: () => Promise.reject('Crash'),
          },
        },
      });
    `
    proc = new CompositeProcess(script)
    await proc.ended
    expect(redactStackTraces(proc.flushOutput())).toMatchInlineSnapshot(`
      Array [
        "Starting composite service...",
        "Starting service 'only'...",
        "Started service 'only'",
        "Started composite service",
        "only | ",
        "only |   Usage",
        "only |     $ tsdx <command> [options]",
        "only | ",
        "only |   Available Commands",
        "only |     create    Create a new package with TSDX",
        "only |     watch     Rebuilds on any change",
        "only |     build     Build your project once and exit",
        "only |     test      Run jest test runner in watch mode.",
        "only |     lint      Run eslint with Prettier",
        "only | ",
        "only |   For more info, run any command with the \`--help\` flag",
        "only |     $ tsdx create --help",
        "only |     $ tsdx watch --help",
        "only | ",
        "only |   Options",
        "only |     -v, --version    Displays current version",
        "only |     -h, --help       Displays this message",
        "only | ",
        "only | ",
        "only | ",
        "Service 'only' crashed",
        "Error in 'only': Error from onCrash function: Crash",
        "Stopping composite service...",
        "Stopped composite service",
        "",
        "",
      ]
    `)
  })
})
