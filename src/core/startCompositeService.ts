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
 * The stdout & stderr of each service is merged and piped to stdout,
 * each line prepended with the service name.
 *
 * Each service is restarted when it crashes.
 *
 * Each service will be told to shut down with `SIGINT`
 * when the composite service is itself told to shut down
 * (with `ctrl+c`, `SIGINT`, or `SIGTERM`),
 * or when a [fatal error](../guides/errors) occurs.
 *
 * @param config - Configuration for the composite service
 *
 * @example
 *
 * ```js
 * const {
 *   startCompositeService,
 *   oncePortUsed,
 * } = require('composite-service')
 *
 * const { PORT } = process.env
 * const DATABASE_URL = 'postgresql://localhost:5432/my_db'
 *
 * startCompositeService({
 *   services: {
 *     db: {
 *       command: 'postgres -D ./pgsql/data',
 *       ready: () => oncePortUsed(5432),
 *     }
 *     worker: {
 *       dependencies: ['db'],
 *       command: 'node worker.js',
 *       env: { DATABASE_URL },
 *     },
 *     http: {
 *       dependencies: ['db'],
 *       command: ['node', 'http-server.js'],
 *       env: { PORT, DATABASE_URL },
 *     },
 *    },
 * })
 * ```
 *
 * @public
 */
export function startCompositeService(config: CompositeServiceConfig) {
  assert(!started, 'Already started a composite service in this process')
  started = true
  new CompositeService(config)
}
