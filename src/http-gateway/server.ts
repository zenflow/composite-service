import { once } from 'events'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { HttpGatewayConfig } from './HttpGatewayConfig'

const app = express()

// eslint-disable-next-line no-eval
const proxies: HttpGatewayConfig['proxies'] = eval(
  process.env.PROXIES as string,
)
for (const [filter, options] of proxies) {
  const middleware = createProxyMiddleware(filter, options)
  app.use(middleware)
}

const host = process.env.HOST as string
const port = Number.parseInt(process.env.PORT as string, 10)
const server = app.listen(port, host)
once(server, 'listening').then(() => {
  console.log(`Listening @ http://${host}:${port}`)
})
