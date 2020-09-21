import { promisify } from 'util'
import { once } from 'events'
import { Readable, pipeline } from 'stream'
import { ChildProcessWithoutNullStreams } from 'child_process'
import mergeStream from 'merge-stream'
import splitStream from 'split'
import { NormalizedServiceConfig } from './validateAndNormalizeConfig'
import { spawnProcess } from './spawnProcess'
import { Logger } from './Logger'
import { filterBlankLastLine, tapStreamLines } from './util/stream'

const delay = promisify(setTimeout)

export class ServiceProcess {
  public readonly output: Readable
  public readonly started: Promise<void>
  public logTail: string[] = []
  private readonly serviceId: string
  private readonly serviceConfig: NormalizedServiceConfig
  private readonly logger: Logger
  private readonly process: ChildProcessWithoutNullStreams
  private didError = false
  private didEnd = false
  private readonly ended: Promise<void>
  private wasEndCalled = false
  constructor(
    serviceId: string,
    serviceConfig: NormalizedServiceConfig,
    logger: Logger,
    onCrash: () => void,
  ) {
    this.serviceId = serviceId
    this.serviceConfig = serviceConfig
    this.logger = logger
    this.process = spawnProcess(this.serviceConfig)
    this.started = Promise.race([once(this.process, 'error'), delay(100)]).then(
      result => {
        if (result && result[0]) {
          this.didError = true
          throw result[0]
        }
      },
    )
    this.output = getProcessOutput(this.process)
    if (this.serviceConfig.logTailLength > 0) {
      this.output = this.output.pipe(
        tapStreamLines(line => {
          this.logTail.push(line)
          if (this.logTail.length > this.serviceConfig.logTailLength) {
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
  public end(windowsCtrlCShutdown: boolean) {
    if (!this.wasEndCalled) {
      this.wasEndCalled = true
      if (this.isRunning()) {
        if (windowsCtrlCShutdown) {
          // Don't call this.process.kill(); ctrl+c was already sent to all services
          this.forceKillAfterTimeout()
        } else if (process.platform === 'win32') {
          this.process.kill()
          // Don't call this.forceKillAfterTimeout(); On Windows we don't have SIGINT vs SIGKILL
        } else {
          this.process.kill('SIGINT')
          this.forceKillAfterTimeout()
        }
      }
    }
    return this.ended
  }
  private forceKillAfterTimeout() {
    if (this.serviceConfig.forceKillTimeout === Infinity) {
      return
    }
    setTimeout(() => {
      if (this.isRunning()) {
        this.logger.info(`Force killing service '${this.serviceId}'`)
        this.process.kill('SIGKILL')
      }
    }, this.serviceConfig.forceKillTimeout)
  }
}

function getProcessOutput(proc: ChildProcessWithoutNullStreams) {
  return (mergeStream(
    [proc.stdout, proc.stderr]
      .map(stream => stream.setEncoding('utf8'))
      .map(stream =>
        pipeline(
          stream,
          splitStream((line: string) => `${line}\n`),
          filterBlankLastLine('\n'),
          () => {},
        ),
      ),
  ) as unknown) as Readable
}
