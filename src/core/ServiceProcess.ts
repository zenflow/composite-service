import { promisify } from 'util'
import { once } from 'events'
import { Readable } from 'stream'
import { ChildProcessWithoutNullStreams } from 'child_process'
import mergeStream from 'merge-stream'
import splitStream from 'split'
import { NormalizedServiceConfig } from './validateAndNormalizeConfig'
import { spawnProcess } from './spawnProcess'
import { filterBlankLastLine, tapStreamLines } from './util/stream'

const delay = promisify(setTimeout)

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
    this.started = Promise.race([once(this.process, 'error'), delay(100)]).then(
      result => {
        if (result && result[0]) {
          this.didError = true
          throw result[0]
        }
      },
    )
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
    [proc.stdout, proc.stderr]
      .map(stream => stream.setEncoding('utf8'))
      .map(stream =>
        /* We don't need `stream.pipeline` because we are not:
            1. using streams to propagate/handle errors, *nor*
            2. using streams to cancel upstream work when downstream closes
          The resulting stream just doesn't
            1. propagate destination stream errors to the source stream (not necessary)
            2. can not be cancelled (also not necessary)
        */
        stream
          .pipe(splitStream((line: string) => `${line}\n`))
          .pipe(filterBlankLastLine('\n')),
      ),
  ) as unknown) as Readable
}
