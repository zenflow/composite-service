const { runService } = require('./common')

runService(() => {
  // keep process from exiting
  setInterval(() => {}, 1000)
})
