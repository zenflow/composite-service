import { spawnSync } from "child_process";
import { join } from "path";
import { CompositeProcess } from "./helpers/composite-process";

describe("process", () => {
  beforeAll(() => {
    spawnSync("yarn", {
      cwd: join(__dirname, "fixtures/package"),
      stdio: "ignore",
      shell: true,
    });
  });
  jest.setTimeout(process.platform === "win32" ? 15000 : 5000);
  let proc: CompositeProcess | undefined;
  afterEach(async () => {
    if (proc) await proc.end();
  });
  describe("uses binaries of locally installed packages", () => {
    it("with default cwd", async () => {
      proc = new CompositeProcess(`
        const { startCompositeService } = require('.');
        startCompositeService({
          services: {
            only: {
              command: 'shx --version',
              env: {},
              onCrash: () => Promise.reject(),
            },
          },
        });
      `);
      await proc.ended;
      const output = proc.flushOutput();
      expect(output.find((line) => line.startsWith("only | "))).toBe(
        "only | shx v0.3.4 (using ShellJS v0.8.5)",
      );
    });
    it("with relative cwd", async () => {
      proc = new CompositeProcess(`
        const { startCompositeService } = require('.');
        startCompositeService({
          services: {
            only: {
              cwd: './test/integration/fixtures/package',
              command: 'shx --version',
              env: {},
              onCrash: () => Promise.reject(),
            },
          },
        });
      `);
      await proc.ended;
      const output = proc.flushOutput();
      expect(output.find((line) => line.startsWith("only | "))).toBe(
        "only | shx v0.3.1 (using ShellJS v0.8.4)",
      );
    });
    it("with absolute cwd", async () => {
      proc = new CompositeProcess(`
        const { startCompositeService } = require('.');
        startCompositeService({
          services: {
            only: {
              cwd: ${JSON.stringify(`${__dirname}/fixtures/package`)},
              command: 'shx --version',
              env: {},
              onCrash: () => Promise.reject(),
            },
          },
        });
      `);
      await proc.ended;
      const output = proc.flushOutput();
      expect(output.find((line) => line.startsWith("only | "))).toBe(
        "only | shx v0.3.1 (using ShellJS v0.8.4)",
      );
    });
  });
  (process.platform === "win32" ? it.skip : it)(
    "force kills service after forceKillTimeout",
    async () => {
      proc = new CompositeProcess(`
        const { startCompositeService } = require('.');
        startCompositeService({
          logLevel: 'debug',
          services: {
            only: {
              command: [
                'node',
                '-e',
                'setInterval(() => {}, 1000);'
                  + 'process.on("SIGINT", () => console.log("got SIGINT"));'
                  + 'console.log("started");'
              ],
              ready: ctx => ctx.onceOutputLineIs('started'),
              forceKillTimeout: 500,
            },
          },
        });
      `);
      await proc.start();
      proc.flushOutput();
      await proc.end();
      expect(proc.flushOutput()).toMatchInlineSnapshot(`
[
  " (info) Received shutdown signal (SIGINT)",
  " (debug) Stopping composite service...",
  " (debug) Stopping service 'only'...",
  "only | got SIGINT",
  " (info) Force killing service 'only'",
  " (debug) Stopped service 'only'",
  " (debug) Stopped composite service",
]
`);
    },
  );
});
