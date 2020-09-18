import { ServiceConfig } from './ServiceConfig'

/**
 * Configuration for a composite service
 *
 * @public
 */
export interface CompositeServiceConfig {
  /**
   * Level of detail in logging.
   * Defaults to `'info'`.
   */
  logLevel?: 'debug' | 'info' | 'error'

  /**
   * If `true` then when shutting down,
   * each service will be stopped *only after* all services that depend on it have been stopped.
   * Defaults to `false`.
   *
   * @remarks
   *
   * This option will be ignored when running on Windows and {@link CompositeServiceConfig.windowsCtrlCShutdown} is `true`.
   */
  gracefulShutdown?: boolean

  /**
   * If `true` then when shutting down *on Windows*,
   * all services will be stopped with a single CTRL_C_EVENT.
   * Defaults to `false`.
   *
   * @remarks
   *
   * This is useful for giving services a chance to clean up & exit gracefully *on Windows*,
   * instead of terminated them abruptly.
   *
   * This method however comes with caveats:
   *
   * A CTRL_C_EVENT can only be generated for all processes attached to the console, and not for individual processes.
   * This makes it inherently incompatible with the behavior enabled by {@link CompositeServiceConfig.gracefulShutdown},
   * which needs to signal different processes to exit at different times.
   * Therefore, on Windows, if both `gracefulShutdown` & `windowsCtrlCShutdown` are enabled,
   * the `gracefulShutdown` option will not be respected.
   * The `gracefulShutdown` is always respected on other platforms.
   *
   * Another caveat is that any additional parent processes (or any processes at all) attached to the same console
   * will receive the CTRL_C_EVENT signal, not just the service processes.
   */
  windowsCtrlCShutdown?: boolean

  /**
   * Configuration to use as defaults for every service.
   * Defaults to `{}`.
   */
  serviceDefaults?: ServiceConfig

  /**
   * Configuration for each specific service.
   *
   * @remarks
   *
   * Each key is used as the service ID,
   * and each entry value is a {@link ServiceConfig}.
   *
   * Entries with falsy values (i.e. no configuration) are discarded.
   * Useful for including an entry conditionally, like this:
   *
   * ```js
   * {
   *   services: {
   *     web: { ...webConfig },
   *     worker: process.env === 'production' && { ...workerConfig }
   *   }
   * }
   * ```
   */
  services: {
    [id: string]: ServiceConfig | false | null | undefined | 0 | ''
  }
}
