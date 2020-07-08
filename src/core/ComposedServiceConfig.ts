import { ReadyConfigContext } from './ReadyConfigContext'
import { OnCrashConfigContext } from './OnCrashConfigContext'

/**
 * Configuration for a service to be composed
 *
 * @public
 */
export interface ComposedServiceConfig {
  /**
   * IDs of other composed services that this service depends on.
   * Defaults to `[]`.
   *
   * @remarks
   *
   * The service will not be started until all dependencies are started and ready
   * (as determined by their {@link ComposedServiceConfig.ready | ready config}),
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
   * Command used to run the service
   *
   * @remarks
   *
   * If it's a single string, it will be parsed into binary and arguments.
   * Otherwise it must be an array of strings
   * where the first element is the binary, and the remaining elements are the arguments.
   *
   * The binary part can be the name (path & extension not required) of a Node.js CLI program.
   */
  command: string | string[]

  /**
   * Environment variables to pass to the service.
   * Defaults to `{}`.
   *
   * @remarks
   *
   * Entries with value `undefined` are discarded.
   *
   * No additional variables will be passed to the service, except
   * (1) `PATH`
   * (2) on Windows only, `PATHEXT`, and
   * (3) Some others depending on your OS.
   * For example, on Ubuntu 18.04, service processes will have only `PATH` if no other variables are defined,
   * while on Windows 10, child processes always have `PATH`, `SYSTEMDRIVE`, `SYSTEMROOT`, `TEMP`, etc.
   *
   * The final value used for `PATH` is, if defined, the `PATH` value defined here
   * *appended with paths to locally installed package binaries*.
   * This allows you to execute Node.js CLI programs by name in {@link ComposedServiceConfig.command}.
   *
   * On Windows, the final value used for `PATHEXT` is, if defined, the `PATHEXT` value provided here,
   * or if not defined, the Windows default.
   */
  env?: { [key: string]: string | number | undefined }

  /**
   * A function to determine when the service is ready.
   * Defaults to `() => Promise.resolve()`.
   *
   * @remarks
   *
   * This function takes a {@link ReadyConfigContext} as its only argument
   * and should return a `Promise` that resolves when the service has started up and is ready to do its job.
   *
   * This library includes a collection of [Ready Helpers](./composite-service.oncetcpportused.md)
   * to help you define this property.
   *
   * @param ctx - Context
   */
  ready?: (ctx: ReadyConfigContext) => Promise<any>

  /**
   * A function to be executed each time the service crashes.
   * Defaults to `() => {}`.
   *
   * @remarks
   *
   * This function is called with an {@link OnCrashConfigContext} object as its only argument.
   *
   * It can execute synchronously or asynchronously (i.e. return a promise that will be awaited on).
   *
   * If any error is encountered in its execution,
   * the composite service will shut down any running services and exit,
   * otherwise, the composed service will be restarted.
   *
   * @param ctx - Context
   */
  onCrash?: (ctx: OnCrashConfigContext) => any

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
