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
   * Configuration for each service to be composed.
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