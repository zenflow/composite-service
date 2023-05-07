import { once } from "events";
import { Readable, pipeline } from "stream";
import { ChildProcessWithoutNullStreams } from "child_process";
import mergeStream from "merge-stream";
import splitStream from "split2";
import { NormalizedServiceConfig } from "./validateAndNormalizeConfig";
import { spawnProcess } from "./spawnProcess";
import { Logger } from "./Logger";
import { filterBlankLastLine, tapStreamLines } from "./util/stream";
import { processSpawned } from "./util/processSpawned";

export class ServiceProcess {
  public readonly output: Readable;
  public readonly started: Promise<void>;
  public logTail: string[] = [];
  private readonly serviceId: string;
  private readonly serviceConfig: NormalizedServiceConfig;
  private readonly logger: Logger;
  private readonly process: ChildProcessWithoutNullStreams;
  private didError = false;
  private didEnd = false;
  private readonly ended: Promise<void>;
  private wasEndCalled = false;
  constructor(
    serviceId: string,
    serviceConfig: NormalizedServiceConfig,
    logger: Logger,
    onCrash: () => void
  ) {
    this.serviceId = serviceId;
    this.serviceConfig = serviceConfig;
    this.logger = logger;
    this.process = spawnProcess(this.serviceConfig);
    this.started = processSpawned(this.process).catch((error: Error) => {
      this.didError = true;
      throw error;
    });
    this.output = getProcessOutput(this.process);
    if (this.serviceConfig.logTailLength > 0) {
      this.output = this.output.pipe(
        tapStreamLines((line) => {
          this.logTail.push(line);
          if (this.logTail.length > this.serviceConfig.logTailLength) {
            this.logTail.shift();
          }
        })
      );
    }
    this.ended = once(this.output, "end").then(() => {
      this.didEnd = true;
    });
    Promise.all([this.started.catch(() => {}), this.ended]).then(() => {
      if (!this.didError && !this.wasEndCalled) {
        onCrash();
      }
    });
  }
  public isRunning() {
    return !this.didError && !this.didEnd;
  }
  public end(windowsCtrlCShutdown: boolean) {
    if (!this.wasEndCalled) {
      this.wasEndCalled = true;
      if (this.isRunning()) {
        if (windowsCtrlCShutdown) {
          // ctrl+c signal was already sent to all service processes
          this.forceKillAfterTimeout();
        } else if (process.platform === "win32") {
          this.process.kill();
        } else {
          this.process.kill("SIGINT");
          this.forceKillAfterTimeout();
        }
      }
    }
    return this.ended;
  }
  private forceKillAfterTimeout() {
    if (this.serviceConfig.forceKillTimeout === Infinity) {
      return;
    }
    setTimeout(() => {
      if (this.isRunning()) {
        this.logger.log("info", `Force killing service '${this.serviceId}'`);
        this.process.kill("SIGKILL");
      }
    }, this.serviceConfig.forceKillTimeout);
  }
}

function getProcessOutput(proc: ChildProcessWithoutNullStreams) {
  return mergeStream(
    [proc.stdout, proc.stderr]
      .map((stream) => stream.setEncoding("utf8"))
      .map((stream) => pipeline(stream, splitStream(), filterBlankLastLine(""), () => {}))
  ) as unknown as Readable;
}
