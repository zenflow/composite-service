const { createServer } = require('http')
const { once } = require('events')
const { runService } = require('./common')

runService(() => {
  const server = createServer((_, res) => {
    res.write(process.env.RESPONSE_TEXT || '')
    res.end()
  })
  server.listen(process.env.PORT)
  return once(server, 'listening')
})
