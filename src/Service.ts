import { promisify } from 'util'
import { PassThrough } from 'stream'
import cloneable from 'cloneable-readable'
import { ServiceProcess } from './ServiceProcess'
import { NormalizedServiceConfig } from './validateAndNormalizeConfig'
import { OnCrashContext } from './interfaces/OnCrashContext'
import { ServiceCrash } from './interfaces/ServiceCrash'
import { InternalError } from './InternalError'
import { Logger } from './Logger'
import { createReadyContext } from './createReadyContext'

const delay = promisify(setTimeout)

export class Service {
  public readonly id: string
  public readonly config: NormalizedServiceConfig
  public readonly output = cloneable(new PassThrough({ objectMode: true }))
  private readonly outputClone = this.output.clone()
  private readonly logger: Logger
  private readonly handleFatalError: (message: string) => void
  private ready: Promise<void> | undefined
  private process: ServiceProcess | undefined
  private startResult: Promise<void> | undefined
  private stopResult: Promise<void> | undefined
  private crashes: ServiceCrash[] = []

  constructor(
    id: string,
    config: NormalizedServiceConfig,
    logger: Logger,
    handleFatalError: (message: string) => void,
  ) {
    this.id = id
    this.config = config
    this.logger = logger
    this.handleFatalError = handleFatalError
  }

  public start() {
    if (this.stopResult) {
      this.logger.log(
        'error',
        new InternalError('Cannot start after stopping').stack!,
      )
      return this.startResult
    }
    if (!this.startResult) {
      this.logger.log('debug', `Starting service '${this.id}'...`)
      this.defineReady()
      this.startResult = this.startProcess()
        .then(() => this.ready)
        .then(() => {
          this.logger.log('debug', `Started service '${this.id}'`)
        })
    }
    return this.startResult
  }

  private defineReady() {
    const ctx = createReadyContext(this.outputClone)
    this.ready = promiseTry(() => this.config.ready(ctx))
      .finally(() => this.outputClone.destroy())
      .catch(error => {
        const prefix = `In \`service.${this.id}.ready\``
        this.handleFatalError(`${prefix}: ${maybeErrorText(error)}`)
        return never()
      })
  }

  private async startProcess() {
    const proc = new ServiceProcess(this.id, this.config, this.logger, () => {
      proc.output.unpipe()
      if (!this.stopResult) {
        this.handleCrash(proc)
      }
    })
    this.process = proc
    proc.output.pipe(this.output, { end: false })
    try {
      await this.process.started
    } catch (error) {
      const prefix = `Spawning process for service '${this.id}'`
      this.handleFatalError(`${prefix}: ${error}`)
      await never()
    }
  }

  private async handleCrash(proc: ServiceProcess) {
    this.logger.log('info', `Service '${this.id}' crashed`)
    const delayPromise = delay(this.config.minimumRestartDelay)
    const crash: ServiceCrash = {
      date: new Date(),
      logTail: proc.logTail,
    }
    if (this.config.crashesLength > 0) {
      this.crashes.push(crash)
      if (this.crashes.length > this.config.crashesLength) {
        this.crashes.shift()
      }
    }
    const isServiceReady = await isResolved(this.ready!)
    const ctx: OnCrashContext = {
      serviceId: this.id,
      isServiceReady,
      crash,
      crashes: this.crashes,
    }
    try {
      await this.config.onCrash(ctx)
    } catch (error) {
      const prefix = `In \`service.${this.id}.onCrash\``
      this.handleFatalError(`${prefix}: ${maybeErrorText(error)}`)
      await never()
    }
    await delayPromise
    if (this.stopResult) {
      return
    }
    this.logger.log('info', `Restarting service '${this.id}'`)
    await this.startProcess()
  }

  public stop(windowsCtrlCShutdown: boolean) {
    if (!this.stopResult) {
      if (!this.process || !this.process.isRunning()) {
        this.stopResult = Promise.resolve()
      } else {
        this.logger.log('debug', `Stopping service '${this.id}'...`)
        this.stopResult = this.process.end(windowsCtrlCShutdown).then(() => {
          this.logger.log('debug', `Stopped service '${this.id}'`)
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

function never(): Promise<never> {
  return new Promise<never>(() => {})
}
