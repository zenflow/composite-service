import { ReadyConfigContext } from './ReadyConfigContext'
import { HandleCrashConfigContext } from './HandleCrashConfigContext'

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
   * Command used to run the service
   *
   * @remarks
   *
   * If it's a single string, it will be parsed into binary and arguments.
   *
   * If it's an array of strings, the first element is the binary, and the remaining elements are the arguments.
   */
  command: string | string[]

  /**
   * Environment variables to pass to the service.
   * Defaults to `{}`.
   *
   * @remarks
   *
   * No additional variables will be defined, except `PATH`, and some others depending on your OS.
   * For example, in Windows 10, nodejs child processes always have `PATH`, `PATHEXT`, `WINDIR`, etc.,
   * while in Ubuntu 18.04, nodejs child processes can actually have *no* environment variables if configured that way.
   *
   * TODO: Can the above inconsistency be improved in nodejs? Or is this just an inherent fact/caveat about cross-platform compatibility?
   *
   * Entries with value `undefined` are discarded.
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
   * A function to be called each time the service crashes.
   * Defaults to `() => {}`.
   *
   * @remarks
   *
   * This function takes a {@link HandleCrashConfigContext} as its only argument.
   *
   * It can execute synchronously or asynchronously (i.e. return a promise that will be awaited on).
   *
   * If any error is encountered in its execution,
   * the composite service will shut down any running services and crash,
   * otherwise, the composed service will be restarted.
   *
   * It can be used to dynamically
   * (1) perform arbitrary tasks, like clearing cache files or sending an email notification, and or
   * (2) propagate crashes from composed service to composite service.
   *
   * @param ctx - Context
   */
  handleCrash?: (ctx: HandleCrashConfigContext) => any
}
