import {
  Filter as HttpProxyContext,
  Options as HttpProxyOptions,
} from 'http-proxy-middleware'
import { ServiceConfig } from '../core'

export { HttpProxyContext, HttpProxyOptions }

/**
 * Configuration for a HTTP gateway service
 *
 * @public
 */
export interface HttpGatewayConfig {
  /**
   * Value to use for {@link ServiceConfig.dependencies}
   */
  dependencies?: ServiceConfig['dependencies']

  /**
   * Host to listen on.
   * Defaults to `'0.0.0.0'`.
   */
  host?: string

  /**
   * Port to listen on
   */
  port: number | string

  /**
   * Configuration for each instance of [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)
   *
   * @remarks
   *
   * Each element of this array is a tuple that represents an
   * [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) instance
   * and consists of [HttpProxyContext](https://github.com/chimurai/http-proxy-middleware#context-matching)
   * and [HttpProxyOptions](https://github.com/chimurai/http-proxy-middleware#options).
   *
   * Each incoming HTTP request will be handled by the first proxy that matches that request's context.
   * Therefore, the following example is an example of what *not* to do;
   * the second proxy will never be used, because '/foo/bar' also matches the first proxy,
   * which is used because it came first:
   *
   * ```js
   * {
   *   proxies: [
   *     ['/foo', { target: 'http://localhost:8000' }],
   *     ['/foo/bar', { target: 'http://localhost:8001' }]
   *   ],
   * }
   * ```
   *
   * This value is serialized as JavaScript
   * (using [serialize-javascript](https://github.com/yahoo/serialize-javascript))
   * so functions (and other json-incompatible values) can be passed to the child process.
   *
   * @example
   *
   * ```js
   * {
   *   proxies: {
   *     [['/service-a', '/service-b'], { target: 'http://localhost:8000' }],
   *     ['/websocket-service', { target: 'http://localhost:8001', ws: true }],
   *     ['/', { target: 'http://localhost:8002' }],
   *   },
   * }
   * ```
   *
   */
  proxies: [HttpProxyContext, HttpProxyOptions][]
}
