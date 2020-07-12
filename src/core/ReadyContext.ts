import stream from 'stream'

/**
 * Context object given as argument to each {@link ServiceConfig.ready} function
 *
 * @public
 */
export interface ReadyContext {
  /**
   * Interleaved lines from stdout & stderr of the service.
   *
   * @remarks
   *
   * Each chunk is a utf8 string ending in '\n'.
   *
   * Can be used `as AsyncIterable<string>`.
   */
  output: stream.Readable
}
