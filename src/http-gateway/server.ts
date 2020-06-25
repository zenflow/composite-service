import { once } from 'events'
import connect, { HandleFunction } from 'connect'
import { createProxyMiddleware, Options, Filter } from 'http-proxy-middleware'

const app = connect()

// eslint-disable-next-line no-eval
const proxies: [Filter, Options][] = eval(process.env.PROXIES as string)
for (const [filter, options] of proxies) {
  const middleware = createProxyMiddleware(filter, options)
  app.use(middleware as HandleFunction)
}

const host = process.env.HOST
const port = parseInt(process.env.PORT as string, 10)
const server = app.listen(port, host)
once(server, 'listening').then(() => {
  console.log(`Listening @ http://${host}:${port}`)
})
