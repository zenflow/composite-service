import { PassThrough } from 'stream'

/**
 * Context object given as argument to each
 * {@link ComposedServiceConfig.ready | ComposedServiceConfig.ready function}
 *
 * @public
 */
export interface ReadyConfigContext {
  output: PassThrough
}
