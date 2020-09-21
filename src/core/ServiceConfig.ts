import { ReadyContext } from './ReadyContext'
import { OnCrashContext } from './OnCrashContext'

/**
 * Configuration for a service to be composed
 *
 * @public
 */
export interface ServiceConfig {
  /**
   * IDs of other composed services that this service depends on.
   * Defaults to `[]`.
   *
   * @remarks
   *
   * The service will not be started until all dependencies are started and ready
   * (as determined by their {@link ServiceConfig.ready} functions),
   * and no dependencies will be stopped until the service has stopped.
   */
  dependencies?: string[]

  /**
   * Current working directory of the service.
   * Defaults to `'.'`.
   *
   * @remarks
   *
   * This can be an absolute path or a path relative to the composite service's cwd.
   */
  cwd?: string

  /**
   * Command used to run the service.
   * No default.
   *
   * @remarks
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
   * @remarks
   *
   * The composed service does *not* inherit environment variables from the composite service,
   * unless passed explicitly through this value.
   * This applies even to the `PATH` variable.
   *
   * Entries with value `undefined` are ignored, so it's safe to include entries conditionally,
   * e.g. `env: { DEBUG: isDev ? 'true' : undefined }`.
   */
  env?: { [key: string]: string | number | undefined }

  /**
   * A function to determine when the service is ready.
   * Defaults to `() => Promise.resolve()`.
   *
   * @remarks
   *
   * This function takes a {@link ReadyContext} as its only argument
   * and should return a `Promise` that resolves when the service has started up and is ready to do its job.
   *
   * This library includes a collection of [Ready Helpers](./composite-service.oncetcpportused.md)
   * to help you define this property.
   *
   * @param ctx - Context
   */
  ready?: (ctx: ReadyContext) => Promise<any>

  /**
   * Amount of time in milliseconds to wait for the service to exit before force killing it.
   * Defaults to `5000`.
   */
  forceKillTimeout?: number

  /**
   * A function to be executed each time the service crashes.
   * Defaults to `() => {}`.
   *
   * @remarks
   *
   * This function is called with an {@link OnCrashContext} object as its only argument.
   *
   * It can execute synchronously or asynchronously (i.e. return a promise that will be awaited on).
   *
   * If any error is encountered in its execution,
   * the composite service will shut down any running services and exit,
   * otherwise, the composed service will be restarted.
   *
   * @param ctx - Context
   */
  onCrash?: (ctx: OnCrashContext) => any

  /**
   * Maximum number of lines to keep from the tail of the service's log output.
   * Defaults to `0`.
   */
  logTailLength?: number

  /**
   * Minimum amount of time in milliseconds between the service crashing and being restarted.
   * Defaults to `1000`.
   */
  minimumRestartDelay?: number
}
