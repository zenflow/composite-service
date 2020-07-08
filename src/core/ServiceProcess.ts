import { PassThrough } from 'stream'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { once } from 'events'
import mergeStream from 'merge-stream'
import splitStream from 'split'
import { NormalizedServiceConfig } from './validateAndNormalizeConfig'
import { spawnProcess } from './spawnProcess'

const split = () => splitStream((line: string) => `${line}\n`)

export class ServiceProcess {
  public readonly output = new PassThrough({ objectMode: true })
  public readonly started: Promise<void>
  public isEnded = false
  public logTail: string[] = []
  private readonly process: ChildProcessWithoutNullStreams
  private readonly ended: Promise<void>
  private wasEndCalled = false
  constructor(config: NormalizedServiceConfig, onCrash: () => void) {
    this.process = spawnProcess(config)
    const childOutput = mergeStream(
      this.process.stdout.setEncoding('utf8').pipe(split()),
      this.process.stderr.setEncoding('utf8').pipe(split())
    )
    childOutput.pipe(this.output)
    if (config.logTailLength > 0) {
      this.output.on('data', line => {
        this.logTail.push(line)
        if (this.logTail.length > config.logTailLength) {
          this.logTail.shift()
        }
      })
    }
    const error = new Promise(resolve => this.process.on('error', resolve))
    this.started = Promise.race([
      error,
      new Promise(resolve => setTimeout(resolve, 100)),
    ]).then(error => {
      if (!error) {
        return
      }
      childOutput.unpipe(this.output)
      this.output.end()
      return Promise.reject(error)
    })
    const didStart = this.started.then(
      () => true,
      () => false
    )
    this.ended = Promise.race([error, once(childOutput, 'end')]).then(() => {
      this.isEnded = true
      if (!this.wasEndCalled) {
        didStart.then(didStart => {
          if (didStart) {
            onCrash()
          }
        })
      }
    })
  }
  end() {
    if (!this.wasEndCalled) {
      this.wasEndCalled = true
      if (!this.isEnded) {
        this.process.kill('SIGINT')
      }
    }
    return this.ended
  }
}
