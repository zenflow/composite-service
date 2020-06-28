import { CompositeServiceConfig } from './CompositeServiceConfig'
import { CompositeService } from './CompositeService'
import { assert } from './assert'

let started = false

/**
 * Starts a composite service in the current Node.js process
 *
 * @remarks
 *
 * Each service defined in {@link CompositeServiceConfig.services | `config.services`}
 * is started according to its {@link ComposedServiceConfig | configuration}.
 *
 * The stdout & stderr of every service is merged and piped to stdout,
 * each line prepended with the service name.
 *
 * Each service is restarted when it crashes.
 *
 * Each service is told to shut down with `SIGINT`
 * when the composite service is itself told to shut down
 * (with `ctrl+c`, `SIGINT`, or `SIGTERM`),
 * or when a [fatal error](../guides/errors) occurs.
 *
 * @param config - Configuration for the composite service
 *
 * @public
 */
export function startCompositeService(config: CompositeServiceConfig) {
  assert(!started, 'Already started a composite service in this process')
  started = true
  new CompositeService(config)
}
