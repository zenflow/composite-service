import { CompositeServiceConfig } from './interfaces/CompositeServiceConfig'
import { CompositeService } from './CompositeService'

let started = false

/**
 * Starts a composite service in the current Node.js process
 */
export function startCompositeService(config: CompositeServiceConfig) {
  if (started) {
    throw new Error('Already started a composite service in this process')
  }
  new CompositeService(config)
  started = true
}
