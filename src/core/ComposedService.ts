import { PassThrough } from 'stream'
import { InternalProcess } from './InternalProcess'
import { NormalizedComposedServiceConfig } from './validateAndNormalizeConfig'
import { ReadyConfigContext } from './ReadyConfigContext'
import { HandleCrashConfigContext } from './HandleCrashConfigContext'
import { ComposedServiceCrash } from './ComposedServiceCrash'

export class ComposedService {
  readonly id: string
  readonly config: NormalizedComposedServiceConfig
  readonly output = new PassThrough({ objectMode: true })
  private readonly die: (message: string) => Promise<never>
  private ready: Promise<void> | undefined
  private proc: InternalProcess | undefined
  private startResult: Promise<void> | undefined
  private stopResult: Promise<void> | undefined
  private crashes: ComposedServiceCrash[] = []
  constructor(
    id: string,
    config: NormalizedComposedServiceConfig,
    die: (message: string) => Promise<never>
  ) {
    this.id = id
    this.config = config
    this.die = message => die(`Error in '${id}': ${message}`)
  }
  start() {
    if (this.stopResult) throw new Error('Cannot start after stopping')
    if (!this.startResult) {
      console.log(`Starting service '${this.id}'...`)
      this.defineReady()
      this.startResult = this.startProcess()
        .then(() => this.ready)
        .then(() => {
          console.log(`Started service '${this.id}'`)
        })
    }
    return this.startResult
  }
  private defineReady() {
    this.ready = promiseTry(() => {
      const ctx: ReadyConfigContext = { output: this.output }
      return this.config.ready(ctx)
    }).catch(error => {
      return this.die(`Error from ready function: ${maybeErrorText(error)}`)
    })
  }
  private async startProcess() {
    const proc = new InternalProcess(this.config.command, this.config.env)
    this.proc = proc
    proc.output.pipe(this.output, { end: false })
    proc.ended.then(async () => {
      if (!this.stopResult && (await didProcessStart())) {
        this.handleCrash(proc)
      }
      function didProcessStart() {
        return proc.started.then(
          () => true,
          () => false
        )
      }
    })
    try {
      await this.proc.started
    } catch (error) {
      await this.die(`Error starting process: ${error.stack}`)
    }
  }
  private async handleCrash(proc: InternalProcess) {
    console.log(`Service '${this.id}' crashed`)
    void proc
    const crash: ComposedServiceCrash = {
      date: new Date(),
    }
    this.crashes.push(crash)
    const isServiceReady = await isResolved(this.ready!)
    const ctx: HandleCrashConfigContext = {
      isServiceReady,
      crash,
      crashes: this.crashes,
    }
    try {
      await this.config.handleCrash(ctx)
    } catch (error) {
      await this.die(
        `Error from handleCrash function: ${maybeErrorText(error)}`
      )
    }
    console.log(`Restarting service '${this.id}'...`)
    await this.startProcess()
    console.log(`Restarted service '${this.id}'`)
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

function isResolved(promise: Promise<any>): Promise<boolean> {
  return Promise.race([
    promise.then(
      () => true,
      () => false
    ),
    Promise.resolve().then(() => false),
  ])
}
