import stream from 'stream'

/**
 * Context object given as argument to each {@link ServiceConfig.ready} function
 *
 * @public
 */
export interface ReadyContext {
  /**
   * Interleaved lines from stdout & stderr of the service
   */
  output: stream.Readable
}
