setInterval(() => {}, 1000)
process.on('SIGINT', () => {
  console.log('got SIGINT')
  // process.exit(130)
})
console.log('Started')
