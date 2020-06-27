import stream from 'stream'

/**
 * Context object given as argument to each
 * {@link ComposedServiceConfig.ready | ComposedServiceConfig.ready function}
 *
 * @public
 */
export interface ReadyConfigContext {
  /**
   * Interleaved lines from stdout & stderr of service
   */
  output: stream.Readable
}
