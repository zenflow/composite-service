import { CompositeProcess } from "./helpers/composite-process";
import { redactConfigDump, redactStackTraces } from "./helpers/redact";
import { fetchText } from "./helpers/fetch";

// TODO: `const delay = promisify(setTimeout)` doesn't work here for some reason
const delay = (time: number) => new Promise(resolve => setTimeout(() => resolve(), time));

function getScript(customCode = "") {
  return `
    const { startCompositeService } = require('.');
    const config = {
      logLevel: 'debug',
      gracefulShutdown: true,
      serviceDefaults: {
        command: 'node test/integration/fixtures/http-service.js',
        ready: ctx => ctx.onceOutputLineIs('Started 🚀'),
      },
      services: {
        first: {
          env: { PORT: 8001, RESPONSE_TEXT: 'first' },
        },
        second: {
          dependencies: ['first'],
          env: { PORT: 8002, RESPONSE_TEXT: 'second' },
        },
        third: {
          dependencies: ['first', 'second'],
          env: { PORT: 8003, RESPONSE_TEXT: 'third' },
        },
      },
    };
    ${customCode};
    startCompositeService(config);
  `;
}

describe("crashing", () => {
  jest.setTimeout(process.platform === "win32" ? 45000 : 15000);
  let proc: CompositeProcess | undefined;
  afterEach(async () => {
    if (proc) await proc.end();
  });
  it("crashes before starting on error validating configuration", async () => {
    const script = `
      const { startCompositeService } = require('.');
      startCompositeService({
        logLevel: 'debug',
        services: {},
      });
    `;
    proc = new CompositeProcess(script);
    await proc.ended;
    let output = redactStackTraces(proc.flushOutput());
    output.shift(); // ignore first line like "<file path>:<line number>"
    output = output.filter(line => line !== `Node.js ${process.version}`); // ignore node version line
    while (output.slice(-1)[0] === "") output.pop(); // remove trailing blank lines, which vary in number between node versions for some reason
    expect(output).toMatchInlineSnapshot(`
      Array [
        "    throw new ConfigValidationError(\\"\`config.services\` has no entries\\");",
        "    ^",
        "",
        "ConfigValidationError: \`config.services\` has no entries",
        "<stack trace>",
      ]
    `);
  });
  it("crashes gracefully on error spawning process", async () => {
    const script = getScript(`
      config.services.second.command = 'this_command_does_not_exist';
    `);
    proc = new CompositeProcess(script);
    await proc.ended;
    const output = redactStackTraces(redactConfigDump(proc.flushOutput()));
    expect(output).toMatchInlineSnapshot(`
      Array [
        "<config dump>",
        " (debug) Starting composite service...",
        " (debug) Starting service 'first'...",
        "first | Started 🚀",
        " (debug) Started service 'first'",
        " (debug) Starting service 'second'...",
        " (error) Fatal error: Spawning process for service 'second': Error: spawn this_command_does_not_exist ENOENT",
        "<stack trace>",
        "<errno field>",
        " (error)   code: 'ENOENT',",
        " (error)   syscall: 'spawn this_command_does_not_exist',",
        " (error)   path: 'this_command_does_not_exist',",
        " (error)   spawnargs: []",
        " (error) }",
        " (debug) Stopping composite service...",
        " (debug) Stopping service 'first'...",
        " (debug) Stopped service 'first'",
        " (debug) Stopped composite service",
      ]
    `);
  });
  it("crashes gracefully on error from ready", async () => {
    const script = getScript(`
      config.services.second.ready = () => global.foo.bar();
    `);
    proc = new CompositeProcess(script);
    await proc.ended;
    const output = redactStackTraces(redactConfigDump(proc.flushOutput()));
    expect(output).toMatchInlineSnapshot(`
      Array [
        "<config dump>",
        " (debug) Starting composite service...",
        " (debug) Starting service 'first'...",
        "first | Started 🚀",
        " (debug) Started service 'first'",
        " (debug) Starting service 'second'...",
        " (error) Fatal error: In \`service.second.ready\`: TypeError: Cannot read properties of undefined (reading 'bar')",
        "<stack trace>",
        " (debug) Stopping composite service...",
        " (debug) Stopping service 'second'...",
        " (debug) Stopped service 'second'",
        " (debug) Stopping service 'first'...",
        " (debug) Stopped service 'first'",
        " (debug) Stopped composite service",
      ]
    `);
  });
  it("crashes gracefully on error from pre-ready onCrash", async () => {
    const script = getScript(`
      config.services.second.command = ['node', '-e', 'console.log("Crashing")'];
      config.services.second.onCrash = ctx => {
        console.log('isServiceReady:', ctx.isServiceReady)
        throw new Error('Crash')
      };
    `);
    proc = new CompositeProcess(script);
    await proc.ended;
    const output = redactStackTraces(redactConfigDump(proc.flushOutput()));
    expect(output).toMatchInlineSnapshot(`
      Array [
        "<config dump>",
        " (debug) Starting composite service...",
        " (debug) Starting service 'first'...",
        "first | Started 🚀",
        " (debug) Started service 'first'",
        " (debug) Starting service 'second'...",
        "second | Crashing",
        " (info) Service 'second' crashed",
        "isServiceReady: false",
        " (error) Fatal error: In \`service.second.onCrash\`: Error: Crash",
        "<stack trace>",
        " (debug) Stopping composite service...",
        " (debug) Stopping service 'first'...",
        " (debug) Stopped service 'first'",
        " (debug) Stopped composite service",
      ]
    `);
  });
  it("crashes gracefully on error from post-ready onCrash", async () => {
    const script = getScript(`
      config.services.second.onCrash = ctx => {
        console.log('isServiceReady:', ctx.isServiceReady)
        throw new Error('Crash')
      };
    `);
    proc = await new CompositeProcess(script).start();
    proc.flushOutput();
    expect(await fetchText("http://localhost:8002/?crash")).toBe("crashing");
    await proc.ended;
    let output = redactStackTraces(proc.flushOutput());
    expect(output).toMatchInlineSnapshot(`
      Array [
        "second | Crashing",
        " (info) Service 'second' crashed",
        "isServiceReady: true",
        " (error) Fatal error: In \`service.second.onCrash\`: Error: Crash",
        "<stack trace>",
        " (debug) Stopping composite service...",
        " (debug) Stopping service 'third'...",
        " (debug) Stopped service 'third'",
        " (debug) Stopping service 'first'...",
        " (debug) Stopped service 'first'",
        " (debug) Stopped composite service",
      ]
    `);
  });
  it("restarts service on successful pre-ready onCrash", async () => {
    const script = getScript(`
      config.services.second.command = ['node', '-e', 'console.log("Crashing")'];
      config.services.second.crashesLength = 3;
      config.services.second.onCrash = ctx => {
        if (ctx.crashes.length === 3) throw new Error('Crashed three times');
      };
    `);
    proc = new CompositeProcess(script);
    await proc.ended;
    const output = redactStackTraces(redactConfigDump(proc.flushOutput()));
    expect(output).toMatchInlineSnapshot(`
      Array [
        "<config dump>",
        " (debug) Starting composite service...",
        " (debug) Starting service 'first'...",
        "first | Started 🚀",
        " (debug) Started service 'first'",
        " (debug) Starting service 'second'...",
        "second | Crashing",
        " (info) Service 'second' crashed",
        " (info) Restarting service 'second'",
        "second | Crashing",
        " (info) Service 'second' crashed",
        " (info) Restarting service 'second'",
        "second | Crashing",
        " (info) Service 'second' crashed",
        " (error) Fatal error: In \`service.second.onCrash\`: Error: Crashed three times",
        "<stack trace>",
        " (debug) Stopping composite service...",
        " (debug) Stopping service 'first'...",
        " (debug) Stopped service 'first'",
        " (debug) Stopped composite service",
      ]
    `);
  });
  it("restarts service on successful post-ready onCrash", async () => {
    const script = getScript(`
      config.services.second.crashesLength = 2;
      config.services.second.logTailLength = 1;
      config.services.second.onCrash = async ctx => {
        const tests = [
          'ctx.serviceId === "second"',
          'ctx.isServiceReady === true',
          'typeof ctx.crash === "object"',
          'Array.isArray(ctx.crashes)',
          'ctx.crashes.length >= 1',
          'ctx.crashes.slice(-1)[0] === ctx.crash',
          'ctx.crashes.every(crash => crash.date instanceof Date)',
          'ctx.crashes.every(crash => Array.isArray(crash.logTail))',
        ];
        tests.forEach(test => !eval(test) && console.log('Failed', test));
        console.log('number of crashes:', ctx.crashes.length);
        console.log('crash logTail:', JSON.stringify(ctx.crash.logTail));
        console.log('Handling crash...');
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('Done handling crash');
      };
    `);
    proc = await new CompositeProcess(script).start();
    proc.flushOutput();

    // crash once
    expect(await fetchText("http://localhost:8002/?crash")).toBe("crashing");
    // allow time for restart
    await delay(500);
    // make sure it restarted
    expect(await fetchText("http://localhost:8002/")).toBe("second");
    // correct output for 1st crash
    expect(proc.flushOutput()).toMatchInlineSnapshot(`
      Array [
        "second | Crashing",
        " (info) Service 'second' crashed",
        "number of crashes: 1",
        "crash logTail: [\\"Crashing\\"]",
        "Handling crash...",
        "Done handling crash",
        " (info) Restarting service 'second'",
        "second | Started 🚀",
      ]
    `);

    // crash again
    expect(await fetchText("http://localhost:8002/?crash")).toBe("crashing");
    // allow time for restart again
    await delay(500);
    // make sure it restarted again
    expect(await fetchText("http://localhost:8002/")).toBe("second");
    // correct output for 2nd crash
    expect(proc.flushOutput()).toMatchInlineSnapshot(`
      Array [
        "second | Crashing",
        " (info) Service 'second' crashed",
        "number of crashes: 2",
        "crash logTail: [\\"Crashing\\"]",
        "Handling crash...",
        "Done handling crash",
        " (info) Restarting service 'second'",
        "second | Started 🚀",
      ]
    `);

    // crash again
    expect(await fetchText("http://localhost:8002/?crash")).toBe("crashing");
    // allow time for restart again
    await delay(500);
    // make sure it restarted again
    expect(await fetchText("http://localhost:8002/")).toBe("second");
    // correct output for 3rd crash
    expect(proc.flushOutput()).toMatchInlineSnapshot(`
      Array [
        "second | Crashing",
        " (info) Service 'second' crashed",
        "number of crashes: 2",
        "crash logTail: [\\"Crashing\\"]",
        "Handling crash...",
        "Done handling crash",
        " (info) Restarting service 'second'",
        "second | Started 🚀",
      ]
    `);
  });
});
