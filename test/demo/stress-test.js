const { startCompositeService } = require("../../dist");

const numberOfServices = 5;

startCompositeService({
  logLevel: "error",
  services: Object.fromEntries(
    Array.from({ length: numberOfServices }, (_, index) => [
      `service${index}`,
      { command: "echo ok" },
    ]),
  ),
});
