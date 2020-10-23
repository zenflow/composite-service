const { startCompositeService } = require('..')

const hang = process.argv.includes('--hang')

const command = [
  'node',
  '-e',
  `\
console.log('hi');
setInterval(() => {});
process.on('SIGINT', () => {
  console.log('got SIGINT');
  if (${hang}) return;
  setTimeout(() => {
    console.log('bye');
    process.exit(130);
  }, 1000);
});`,
]

startCompositeService({
  gracefulShutdown: true,
  windowsCtrlCShutdown: true,
  serviceDefaults: {
    command,
    forceKillTimeout: 2000,
  },
  services: {
    foo: {},
    bar: { dependencies: ['foo'] },
  },
})
