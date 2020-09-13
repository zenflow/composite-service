import { promisify } from 'util'
import { PassThrough } from 'stream'
import cloneable from 'cloneable-readable'
import { ServiceProcess } from './ServiceProcess'
import { NormalizedServiceConfig } from './validateAndNormalizeConfig'
import { ReadyContext } from './ReadyContext'
import { OnCrashContext } from './OnCrashContext'
import { ServiceCrash } from './ServiceCrash'
import { InternalError } from './InternalError'
import { Logger } from './Logger'

const delay = promisify(setTimeout)

export class Service {
  public readonly id: string
  public readonly config: NormalizedServiceConfig
  public readonly output = cloneable(new PassThrough({ objectMode: true }))
  private readonly outputClone = this.output.clone()
  private readonly logger: Logger
  private readonly handleError: (message: string) => Promise<never>
  private ready: Promise<void> | undefined
  private process: ServiceProcess | undefined
  private startResult: Promise<void> | undefined
  private stopResult: Promise<void> | undefined
  private crashes: ServiceCrash[] = []
  constructor(
    id: string,
    config: NormalizedServiceConfig,
    logger: Logger,
    handleError: (message: string) => Promise<never>,
  ) {
    this.id = id
    this.config = config
    this.logger = logger
    this.handleError = handleError
  }
  public start() {
    if (this.stopResult) {
      this.logger.error(new InternalError('Cannot start after stopping').stack!)
      return this.startResult
    }
    if (!this.startResult) {
      this.logger.info(`Starting service '${this.id}'...`)
      this.defineReady()
      this.startResult = this.startProcess()
        .then(() => this.ready)
        .then(() => {
          this.logger.info(`Started service '${this.id}'`)
        })
    }
    return this.startResult
  }
  private defineReady() {
    const ctx: ReadyContext = {
      output: this.outputClone,
    }
    this.ready = promiseTry(() => this.config.ready(ctx))
      .catch(error =>
        this.handleError(`Error from ready function: ${maybeErrorText(error)}`),
      )
      .then(() => {
        this.outputClone.destroy()
      })
  }
  private async startProcess() {
    const proc = new ServiceProcess(this.config, () => {
      proc.output.unpipe()
      this.handleCrash(proc)
    })
    this.process = proc
    proc.output.pipe(this.output, { end: false })
    try {
      await this.process.started
    } catch (error) {
      await this.handleError(`Error starting process: ${error}`)
    }
  }
  private async handleCrash(proc: ServiceProcess) {
    if (this.stopResult) {
      this.logger.error(
        new InternalError('Not expecting handleCrash called when stopping')
          .stack!,
      )
      return
    }
    this.logger.info(`Service '${this.id}' crashed`)
    const delayPromise = delay(this.config.minimumRestartDelay)
    const crash: ServiceCrash = {
      date: new Date(),
      logTail: proc.logTail,
    }
    this.crashes.push(crash)
    const isServiceReady = await isResolved(this.ready!)
    const ctx: OnCrashContext = {
      isServiceReady,
      crash,
      crashes: this.crashes,
    }
    try {
      await this.config.onCrash(ctx)
    } catch (error) {
      await this.handleError(
        `Error from onCrash function: ${maybeErrorText(error)}`,
      )
    }
    if (this.stopResult) {
      return
    }
    await delayPromise
    if (this.stopResult) {
      return
    }
    this.logger.info(`Restarting service '${this.id}'`)
    await this.startProcess()
  }
  public stop() {
    if (!this.stopResult) {
      if (!this.process || !this.process.isRunning()) {
        this.stopResult = Promise.resolve()
      } else {
        this.logger.info(`Stopping service '${this.id}'...`)
        this.stopResult = this.process.end().then(() => {
          this.logger.info(`Stopped service '${this.id}'`)
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

function isResolved(promise: Promise<any>): Promise<boolean> {
  return Promise.race([
    promise.then(
      () => true,
      () => false,
    ),
    Promise.resolve().then(() => false),
  ])
}
