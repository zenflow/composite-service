import stream from 'stream'

/**
 * Context object given as argument to the
 * {@link ComposedServiceConfig.ready | ComposedServiceConfig.ready function}
 *
 * @public
 */
export interface ReadyConfigContext {
  /**
   * Interleaved lines from stdout & stderr of the service
   */
  output: stream.Readable
}
