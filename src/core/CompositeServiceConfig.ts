import { ComposedServiceConfig } from './ComposedServiceConfig'

/**
 * Configuration for a composite service
 *
 * @public
 */
export interface CompositeServiceConfig {
  /**
   * Whether to print the configuration before starting the composite service.
   * Defaults to false.
   *
   * @remarks
   *
   * Useful for debugging dynamic configurations.
   */
  printConfig?: boolean

  /**
   * Configuration for each service to be composed.
   *
   * @remarks
   *
   * Each key is used as the service ID,
   * and each entry value is a {@link ComposedServiceConfig}.
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
    [id: string]: ComposedServiceConfig | false | null | undefined | 0 | ''
  }
}
