const { createServer } = require('http')
const { once } = require('events')

const wait = ms =>
  new Promise(resolve => setTimeout(resolve, Number.parseInt(ms || '0', 10)))

wait(process.env.START_DELAY)
  .then(() => {
    const server = createServer((req, res) => {
      if (req.url.endsWith('?crash')) {
        console.log('Crashing')
        process.exit(1)
      } else {
        res.write(process.env.RESPONSE_TEXT || '')
        res.end()
      }
    })
    server.listen(process.env.PORT)
    return once(server, 'listening')
  })
  .then(() => console.log('Started 🚀'))

process.on('SIGINT', () => {
  wait(process.env.STOP_DELAY).then(() => process.exit(1))
})
