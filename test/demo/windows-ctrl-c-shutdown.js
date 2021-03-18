const { startCompositeService } = require("../../dist");

const logLevel = process.argv.includes("--log-level")
  ? process.argv[process.argv.indexOf("--log-level") + 1]
  : undefined;
const hang = process.argv.includes("--hang");

const command = [
  "node",
  "-e",
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
];

startCompositeService({
  logLevel,
  gracefulShutdown: true,
  windowsCtrlCShutdown: true,
  serviceDefaults: {
    command,
    forceKillTimeout: 2000,
  },
  services: {
    one: {},
    two: { dependencies: ["one"] },
    three: { dependencies: ["one"] },
    four: { dependencies: ["two", "three"] },
  },
});
