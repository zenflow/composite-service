import { ReadyContext } from './ReadyContext'
import { OnCrashContext } from './OnCrashContext'

/**
 * Configuration for a service to be composed
 */
export interface ServiceConfig {
  /**
   * IDs of other composed services that this service depends on.
   * Defaults to `[]`.
   *
   * The service will not be started until all its dependencies have started and become ready
   * (as determined by their {@link ServiceConfig.ready} functions),
   *
   * If {@link CompositeServiceConfig.gracefulShutdown} is enabled,
   * the service's dependencies will not be stopped until the service has been stopped.
   */
  dependencies?: string[]

  /**
   * Current working directory of the service.
   * Defaults to `'.'`.
   *
   * This can be an absolute path or a path relative to the composite service's cwd.
   */
  cwd?: string

  /**
   * Command used to run the service.
   * Required.
   *
   * If it's an array of strings, the first element is the binary, and the remaining elements are the arguments.
   * If it's a single string, it will be parsed into the format described above
   * with a simple `command.split(/\s+/).filter(Boolean)`.
   *
   * The binary part can be the name (path & extension not required) of a Node.js CLI program.
   */
  command?: string | string[]

  /**
   * Environment variables to pass to the service.
   * Defaults to `process.env`.
   *
   * The composed service does *not* inherit environment variables from the composite service,
   * unless passed explicitly through this value.
   * This applies even to the `PATH` variable.
   *
   * Entries with value `undefined` are ignored.
   */
  env?: { [key: string]: string | number | undefined }

  /**
   * A function to determine when the service is ready.
   * Defaults to `() => Promise.resolve()`.
   *
   * This function takes a {@link ReadyContext} as its only argument
   * and should return a `Promise` that resolves when the service has started up and is ready to do its job.
   *
   * If any error is encountered in its execution,
   * the composite service will shut down any running services and exit.
   */
  ready?: (ctx: ReadyContext) => Promise<void>

  /**
   * Amount of time in milliseconds to wait for the service to exit before force killing it.
   * Defaults to `5000`.
   */
  forceKillTimeout?: number

  /**
   * A function to be executed each time the service crashes.
   * Defaults to `ctx => { if (!ctx.isServiceReady) throw new Error('Crashed before becoming ready') }`.
   *
   * This function is called with an {@link OnCrashContext} object as its only argument.
   *
   * It can execute synchronously or asynchronously (i.e. return a promise that will be awaited on).
   *
   * If any error is encountered in its execution,
   * the composite service will shut down any running services and exit,
   * otherwise, the composed service will be restarted.
   */
  onCrash?: (ctx: OnCrashContext) => void | Promise<void>

  /**
   * Maximum number of latest crashes to keep record of.
   * Defaults to `0`.
   *
   * The recorded crashes can be accessed in your {@link ServiceConfig.onCrash} function,
   * as `ctx.crashes`.
   */
  crashesLength?: number

  /**
   * Maximum number of lines to keep from the tail of the child process's console output.
   * Defaults to `0`.
   *
   * The log lines for can be accessed in your {@link ServiceConfig.onCrash} function,
   * as `ctx.crash.logTail` or `ctx.crashes[i].logTail`.
   */
  logTailLength?: number

  /**
   * Minimum amount of time in milliseconds between the service crashing and being restarted.
   * Defaults to `0`.
   */
  minimumRestartDelay?: number
}
