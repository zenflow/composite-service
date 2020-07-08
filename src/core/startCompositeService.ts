import { CompositeServiceConfig } from './CompositeServiceConfig'
import { CompositeService } from './CompositeService'

let started = false

/**
 * Starts a composite service in the current Node.js process
 *
 * @remarks
 *
 * Each service defined in {@link CompositeServiceConfig.services}
 * is started and managed according to its {@link ServiceConfig}.
 *
 * The stdout & stderr from each service is piped to stdout,
 * each line prepended with the service ID.
 *
 * Each service is told to shut down with `SIGINT`
 * when the composite service is itself told to shut down
 * (with `ctrl+c`, `SIGINT`, or `SIGTERM`),
 * or when a fatal error occurs.
 *
 * All possible fatal errors:
 * (1) A composite service was already started in this process
 * (2) Error validating configuration
 * (3) Error spawning process, e.g. `EPERM`, `ENOENT`, etc.
 * (4) Error from user-provided configuration function,
 * {@link ServiceConfig.ready} or {@link ServiceConfig.onCrash}
 *
 * @param config - Configuration for the composite service
 *
 * @public
 */
export function startCompositeService(config: CompositeServiceConfig) {
  if (started) {
    throw new Error('Already started a composite service in this process')
  }
  started = true
  new CompositeService(config)
}
