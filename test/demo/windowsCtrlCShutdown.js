const { startCompositeService } = require('../..')

const command = [
  'node',
  '-e',
  `\
setInterval(() => {});
process.on('SIGINT', () => {
  console.log('got SIGINT');
  setTimeout(() => {
    console.log('bye');
    process.exit(130);
  }, 1000);
});`,
]

startCompositeService({
  gracefulShutdown: true,
  windowsCtrlCShutdown: true,
  services: {
    foo: { command },
    bar: { dependencies: ['foo'], command },
  },
})
