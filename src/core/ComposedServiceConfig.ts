import { ReadyConfigContext } from './ReadyConfigContext'

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
   * The function takes a {@link ReadyConfigContext} as its only argument
   * and should return a `Promise` that resolves when the service has started up and is ready to do its job.
   *
   * This library includes a collection of [Ready Helpers](./composite-service.oncetcpportused.md)
   * to help you define this property.
   */
  ready?: (ctx: ReadyConfigContext) => Promise<any>
}
