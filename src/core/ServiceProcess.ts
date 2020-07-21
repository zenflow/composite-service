import { once } from 'events'
import { Readable } from 'stream'
import { ChildProcessWithoutNullStreams } from 'child_process'
import mergeStream from 'merge-stream'
import splitStream from 'split'
import { NormalizedServiceConfig } from './validateAndNormalizeConfig'
import { spawnProcess } from './spawnProcess'
import { tapStreamLines, filterBlankLastLine } from './util/stream'

export class ServiceProcess {
  public readonly output: Readable
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
    this.output = getProcessOutput(this.process)
    if (config.logTailLength > 0) {
      this.output = this.output.pipe(
        tapStreamLines(line => {
          this.logTail.push(line)
          if (this.logTail.length > config.logTailLength) {
            this.logTail.shift()
          }
        }),
      )
    }
    this.ended = Promise.all([
      this.started.catch(() => {}),
      once(this.output, 'end').then(() => {
        this.didEnd = true
      }),
    ]).then(() => {
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

function getProcessOutput(proc: ChildProcessWithoutNullStreams) {
  return (mergeStream(
    [proc.stdout, proc.stderr].map(stream =>
      stream
        .setEncoding('utf8')
        .pipe(splitStream((line: string) => `${line}\n`))
        .pipe(filterBlankLastLine('\n')),
    ),
  ) as unknown) as Readable
}
