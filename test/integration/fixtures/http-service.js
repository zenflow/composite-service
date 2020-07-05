const { createServer } = require('http')
const { once } = require('events')

if (process.env.CRASH_BEFORE_STARTED) {
  crash()
} else {
  wait(Number.parseInt(process.env.START_DELAY || '0', 10))
    .then(() => {
      const server = createServer((req, res) => {
        if (req.url.endsWith('?crash')) {
          crash()
        } else {
          res.write(process.env.RESPONSE_TEXT || '')
          res.end()
        }
      })
      server.listen(process.env.PORT)
      return once(server, 'listening')
    })
    .then(() => {
      console.log('Started 🚀')
      if (process.env.CRASH_AFTER_STARTED) {
        crash()
      }
    })
  process.on('SIGINT', () => {
    wait(Number.parseInt(process.env.STOP_DELAY || '0', 10)).then(() =>
      process.exit(1)
    )
  })
}

function crash() {
  console.log('Crashing')
  const delay = Number.parseInt(process.env.CRASH_DELAY || '0', 10)
  return wait(delay).then(() => process.exit(1))
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
