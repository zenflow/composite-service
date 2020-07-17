import { spawnSync } from 'child_process'
import { join } from 'path'
import { CompositeProcess } from './helpers/composite-process'

describe('process', () => {
  beforeAll(() => {
    spawnSync('yarn', {
      cwd: join(__dirname, 'fixtures/package'),
      stdio: 'ignore',
      shell: true,
    })
  })
  jest.setTimeout(process.platform === 'win32' ? 15000 : 5000)
  let proc: CompositeProcess | undefined
  afterEach(async () => {
    if (proc) await proc.end()
  })
  describe('Uses binaries of locally installed packages', () => {
    it('with default cwd', async () => {
      proc = new CompositeProcess(`
        const { startCompositeService } = require('.');
        startCompositeService({
          services: {
            only: {
              command: 'shx --version',
              onCrash: () => Promise.reject(),
            },
          },
        });
      `)
      await proc.ended
      const output = proc.flushOutput()
      expect(output.find(line => line.startsWith('only | shx '))).toBe(
        'only | shx v0.3.2 (using ShellJS v0.8.4)',
      )
    })
    it('with relative cwd', async () => {
      proc = new CompositeProcess(`
        const { startCompositeService } = require('.');
        startCompositeService({
          services: {
            only: {
              cwd: './test/integration/fixtures/package',
              command: 'shx --version',
              onCrash: () => Promise.reject(),
            },
          },
        });
      `)
      await proc.ended
      const output = proc.flushOutput()
      expect(output.find(line => line.startsWith('only | shx '))).toBe(
        'only | shx v0.3.1 (using ShellJS v0.8.4)',
      )
    })
    it('with absolute cwd', async () => {
      proc = new CompositeProcess(`
        const { startCompositeService } = require('.');
        startCompositeService({
          services: {
            only: {
              cwd: ${JSON.stringify(`${__dirname}/fixtures/package`)},
              command: 'shx --version',
              onCrash: () => Promise.reject(),
            },
          },
        });
      `)
      await proc.ended
      const output = proc.flushOutput()
      expect(output.find(line => line.startsWith('only | shx '))).toBe(
        'only | shx v0.3.1 (using ShellJS v0.8.4)',
      )
    })
  })
})
