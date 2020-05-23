function runService(
  start = () => Promise.resolve(),
  stop = () => Promise.resolve()
) {
  if (process.env.CRASH_BEFORE_STARTED) {
    crash()
  } else {
    wait(Number.parseInt(process.env.START_DELAY || '0', 10))
      .then(() => start())
      .then(() => {
        console.log('Started 🚀')
        if (process.env.CRASH_AFTER_STARTED) {
          crash()
        }
      })
    process.on('SIGINT', () => {
      wait(Number.parseInt(process.env.STOP_DELAY || '0', 10))
        .then(() => stop())
        .then(() => process.exit(1))
    })
  }
}

function crash() {
  const delay = Number.parseInt(process.env.CRASH_DELAY || '0', 10)
  return wait(delay).then(() => process.exit(1))
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { runService }
