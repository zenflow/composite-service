import { Readable, PassThrough } from 'stream'
import { ChildProcessWithoutNullStreams } from 'child_process'
import mergeStream from 'merge-stream'
import splitStream from 'split'
import { NormalizedServiceConfig } from './validateAndNormalizeConfig'
import { spawnProcess } from './spawnProcess'

export class ServiceProcess {
  public readonly output = new PassThrough({ objectMode: true })
  public readonly started: Promise<void>
  public logTail: string[] = []
  private readonly process: ChildProcessWithoutNullStreams
  private didError = false
  private didEnd = false
  private readonly ended: Promise<void>
  private wasEndCalled = false
  constructor(config: NormalizedServiceConfig, onCrash: () => void) {
    this.process = spawnProcess(config)
    this.started = Promise.race([
      new Promise(resolve => this.process.once('error', resolve)),
      new Promise(resolve => setTimeout(() => resolve(), 100)),
    ]).then(error => {
      if (error) {
        this.didError = true
        throw error
      }
    })
    const processOutput = mergeStream(
      transformStream(this.process.stdout),
      transformStream(this.process.stderr)
    )
    this.ended = (async () => {
      for await (const line of processOutput as AsyncIterable<string>) {
        if (this.didError) {
          break
        }
        this.output.write(line)
        if (config.logTailLength > 0) {
          this.logTail.push(line)
          if (this.logTail.length > config.logTailLength) {
            this.logTail.shift()
          }
        }
      }
      this.didEnd = true
      this.output.end()
    })()
    Promise.all([this.started.catch(() => {}), this.ended]).then(() => {
      if (!this.didError && !this.wasEndCalled) {
        onCrash()
      }
    })
  }
  public isRunning() {
    return !this.didError && !this.didEnd
  }
  public end() {
    if (!this.wasEndCalled) {
      this.wasEndCalled = true
      if (this.isRunning()) {
        this.process.kill('SIGINT')
      }
    }
    return this.ended
  }
}

/**
 * Split input into stream of utf8 strings ending in '\n'
 * */
function transformStream(input: Readable): Readable {
  return input
    .setEncoding('utf8')
    .pipe(splitStream((line: string) => `${line}\n`))
}
