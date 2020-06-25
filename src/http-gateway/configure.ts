import serializeJavascript from 'serialize-javascript'
import {
  Options as HttpProxyMiddlewareOptions,
  Filter as HttpProxyMiddlewareContext,
} from 'http-proxy-middleware'
import { ComposedServiceConfig } from '../core'
import { onceOutputLineIncludes } from '../ready-helpers'

export type HttpGatewayServiceConfig = Omit<
  ComposedServiceConfig,
  'command' | 'env' | 'ready'
> & {
  host?: string
  port: number | string
  proxies: HttpProxyConfig[]
}

export type HttpProxyConfig = HttpProxyMiddlewareOptions & {
  context: HttpProxyMiddlewareContext
}

export function configureHttpGatewayService(
  config: HttpGatewayServiceConfig
): ComposedServiceConfig {
  // TODO: validate config
  const { host, port, proxies, ...rest } = config
  return {
    command: ['node', `${__dirname}/http-gateway-server.js`],
    env: {
      HOST: host || '0.0.0.0',
      PORT: String(port),
      PROXIES: serializeJavascript(proxies, { unsafe: true }),
    },
    ready: ctx => onceOutputLineIncludes(ctx.output, 'Listening @ http://'),
    ...rest,
  }
}
