import { ComposedServiceConfig } from '../core'
import serializeJavascript from 'serialize-javascript'
import { onceOutputLineIncludes } from '../ready-helpers'
import { HttpGatewayConfig } from './HttpGatewayConfig'

/**
 * Generates a {@link ComposedServiceConfig} for an HTTP gateway service
 *
 * @param config - Configuration for the HTTP gateway service
 *
 * @remarks
 *
 * The HTTP gateway service will use an array of
 * [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)
 * instances to forward incoming HTTP requests to the appropriate composed (or external)
 * service as determined by the {@link HttpGatewayConfig.proxies | proxies} option.
 *
 * The service can safely be used as a dependency of other services,
 * since its configuration includes {@link ComposedServiceConfig.ready | ready}.
 *
 * @example
 *
 * ```js
 * const {
 *   startCompositeService,
 *   configureHttpGateway,
 * } = require('composite-service')
 *
 * startCompositeService({
 *   services: {
 *     api: {
 *       command: 'node api.js',
 *       env: { PORT: 8000 },
 *     },
 *     web: {
 *       command: 'node web.js',
 *       env: { PORT: 8001 },
 *     },
 *     gateway: configureHttpGateway({
 *       dependencies: ['api', 'web'],
 *       port: process.env.PORT,
 *       proxies: [
 *         ['/api', { target: 'http://localhost:8000' }],
 *         ['/', { target: 'http://localhost:8001' }],
 *       ],
 *     }),
 *   }
 * })
 * ```
 *
 * @public
 */
export function configureHttpGateway(
  config: HttpGatewayConfig
): ComposedServiceConfig {
  // TODO: validate config
  const { dependencies, host, port, proxies } = config
  return {
    dependencies,
    command: ['node', `${__dirname}/http-gateway-server.js`],
    env: {
      HOST: host || '0.0.0.0',
      PORT: String(port),
      PROXIES: serializeJavascript(proxies, { unsafe: true }),
    },
    ready: ctx => onceOutputLineIncludes(ctx.output, 'Listening @ http://'),
  }
}
