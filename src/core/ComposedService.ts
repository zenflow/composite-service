import { PassThrough } from 'stream'
import {
  NormalizedComposedServiceConfig,
  ReadyConfigContext,
} from './config-types'
import { InternalProcess } from './InternalProcess'

export class ComposedService {
  readonly id: string
  readonly config: NormalizedComposedServiceConfig
  readonly output = new PassThrough({ objectMode: true })
  private readonly die: (message: string) => Promise<never>
  private proc: InternalProcess | undefined
  private startResult: Promise<void> | undefined
  private stopResult: Promise<void> | undefined
  constructor(
    id: string,
    config: NormalizedComposedServiceConfig,
    die: (message: string) => Promise<never>
  ) {
    this.id = id
    this.config = config
    this.die = die
  }
  start() {
    if (!this.startResult) {
      console.log(`Starting service '${this.id}'...`)
      this.startResult = this._start().then(() => {
        console.log(`Started service '${this.id}'`)
      })
    }
    return this.startResult
  }
  private async _start() {
    const proc = new InternalProcess(this.config.command, this.config.env)
    this.proc = proc
    const onProcReady = (): void => {
      proc.ended.then(() => {
        if (!this.stopResult) {
          console.log(`\
Process for service '${this.id}' exited
Restarting service '${this.id}'...`)
          this._start().then(() => {
            console.log(`Restarted service '${this.id}'`)
          })
        }
      })
    }
    proc.output.pipe(this.output, { end: false })
    const startedPromise = proc.started.catch(error =>
      Promise.reject(`Error spawning process: ${error.message}`)
    )
    const readyPromise = promiseTry(() => {
      const ctx: ReadyConfigContext = { output: proc.output }
      return this.config.ready(ctx)
    }).catch(error =>
      Promise.reject(`Error waiting to be ready: ${maybeErrorText(error)}`)
    )
    return Promise.race([
      Promise.all([startedPromise, readyPromise]),
      startedPromise
        .then(() => proc.ended)
        .then(() => Promise.reject('Process exited without becoming ready')),
    ])
      .catch(error => this.die(`Error starting service '${this.id}': ${error}`))
      .then(() => {
        onProcReady()
      })
  }
  stop() {
    if (!this.stopResult) {
      if (!this.proc || this.proc.isEnded) {
        this.stopResult = Promise.resolve()
      } else {
        console.log(`Stopping service '${this.id}'...`)
        this.stopResult = this.proc.end().then(() => {
          console.log(`Stopped service '${this.id}'`)
        })
      }
    }
    return this.stopResult
  }
}

export function maybeErrorText(maybeError: any): string {
  return (maybeError instanceof Error && maybeError.stack) || String(maybeError)
}

function promiseTry<T>(fn: () => Promise<T>) {
  try {
    return Promise.resolve(fn())
  } catch (error) {
    return Promise.reject(error)
  }
}
