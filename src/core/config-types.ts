import { PassThrough } from 'stream'
import { Options as HttpProxyOptions } from 'http-proxy-middleware'

export { HttpProxyOptions }

export interface CompositeServiceConfig {
  /**
   * If set to `true`, the given configuration will be printed before starting the composite service. Useful for debugging dynamic configurations.
   */
  printConfig?: boolean

  /**
   * Description of the services to be composed.
   * Each entry represents a service, with the entry key as the service ID, and the entry value as the service configuration.
   * Entries with falsy values (i.e. no configuration) are discarded.
   * Must contain configuration for at least one service.
   */
  services: { [id: string]: ComposedServiceConfig | null | undefined }
}

export interface ComposedServiceConfig {
  /**
   * Other composed services that this service depends on, referenced by ID.
   *
   * This service will not be started until all `dependencies` have started, and no `dependencies` will be stopped until this service has stopped.
   *
   * See "Graceful startup" section for more info.
   */
  dependencies?: string[]

  /**
   * Command used to run the service.
   * If it's a single string, it will be parsed into binary and arguments.
   * If it's an array of strings, the first element is the binary, and the remaining elements are the arguments.
   */
  command: string | string[]

  /**
   * Environment variables to pass to the service.
   *
   * No variables will be defined by default except `PATH`
   *
   * Beyond the control of this library, some additional variables may be defined depending on your OS.
   * For example, in Windows 10, nodejs child processes always have PATH, PATHEXT, WINDIR, etc., while in Linux,
   * nodejs child processes can actually have *no* environment variables if configured that way.
   * TODO: Can this be improved in nodejs? Or is this just an inherent fact/caveat about cross-platform compatibility?
   *
   * Tip: To propagate variables from the parent process, you can easily just include everything from `process.env`,
   * but you should consider passing each necessary variable *explicitly*, in order to maintain a clear picture
   * of which variables are used by which service.
   *
   * Example of propagating variables from the parent process:
   * ```js
   * const { PORT, NODE_ENV } = process.env
   * startCompositeProcess({
   *   services: [
   *     { env: { PORT, NODE_ENV }, ... },
   *     ...
   *   ],
   * })
   * ```
   *
   * Entries with value `undefined` are discarded.
   */
  env?: { [key: string]: string | number | undefined }

  /**
   * A function that returns a promise that resolves when the service has started up and is ready to do its job.
   *
   * See "Graceful startup" section for more info.
   *
   * Defaults to `() => Promise.resolve()`
   */
  ready: (ctx: ReadyConfigContext) => Promise<any>
}

export interface ReadyConfigContext {
  output: PassThrough
}

export interface NormalizedCompositeServiceConfig {
  printConfig: boolean
  services: { [id: string]: NormalizedComposedServiceConfig }
}

export interface NormalizedComposedServiceConfig {
  dependencies: string[]
  command: string[]
  env: { [key: string]: string }
  ready: (ctx: ReadyConfigContext) => Promise<any>
}
