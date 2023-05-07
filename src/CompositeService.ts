import { formatWithOptions } from "util";
import mergeStream from "merge-stream";
import { Service } from "./Service";
import { NormalizedCompositeServiceConfig } from "./validateAndNormalizeConfig";
import { Logger } from "./Logger";
import { mapStreamLines } from "./util/stream";

export class CompositeService {
  private config: NormalizedCompositeServiceConfig;
  private services: Service[];
  private serviceMap: Map<string, Service>;
  private stopping = false;
  private logger: Logger;

  constructor(config: NormalizedCompositeServiceConfig) {
    this.config = config;

    if (this.config.windowsCtrlCShutdown) {
      require("generate-ctrl-c-event"); // make sure this module loads before we even start
    }

    const outputStream = mergeStream();
    outputStream.pipe(process.stdout);

    this.logger = new Logger(this.config.logLevel);
    outputStream.add(this.logger.output);

    this.logger.log("debug", formatWithOptions({ depth: null }, "Config: %O", config));

    process.on("SIGINT", () => this.handleShutdownSignal(130, "SIGINT"));
    process.on("SIGTERM", () => this.handleShutdownSignal(143, "SIGTERM"));
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.on("data", (buffer) => {
        if (buffer.toString("utf8") === "\u0003") {
          this.handleShutdownSignal(130, "ctrl+c");
        }
      });
    }

    this.services = Object.entries(this.config.services).map(
      ([id, config]) => new Service(id, config, this.logger, this.handleFatalError.bind(this))
    );
    this.serviceMap = new Map(this.services.map((service) => [service.id, service]));

    outputStream.add(
      this.services.map(({ output, id }) =>
        output.pipe(mapStreamLines((line) => `${id} | ${line}\n`))
      )
    );

    this.logger.log("debug", "Starting composite service...");
    Promise.all(this.services.map((service) => this.startService(service))).then(() =>
      this.logger.log("debug", "Started composite service")
    );
  }

  private async startService(service: Service) {
    const dependencies = service.config.dependencies.map((id) => this.serviceMap.get(id)!);
    await Promise.all(dependencies.map((service) => this.startService(service)));
    if (this.stopping) {
      await never();
    }
    await service.start();
    if (this.stopping) {
      await never();
    }
  }

  private handleFatalError(message: string): void {
    this.logger.log("error", `Fatal error: ${message}`);
    if (!this.stopping) {
      this.stop(1);
    }
  }

  private handleShutdownSignal(exitCode: number, description: string): void {
    if (!this.stopping) {
      this.logger.log("info", `Received shutdown signal (${description})`);
      this.stop(exitCode);
    }
  }

  private stop(exitCode: number): void {
    if (this.stopping) return;
    this.stopping = true;
    this.logger.log("debug", "Stopping composite service...");
    if (this.config.windowsCtrlCShutdown) {
      require("generate-ctrl-c-event")
        .generateCtrlCAsync()
        .catch((error: Error) => this.logger.log("error", String(error)));
    }
    Promise.all(this.services.map((service) => this.stopService(service)))
      .then(() => this.logger.log("debug", "Stopped composite service"))
      // Wait one micro tick for output to flush
      .then(() => process.exit(exitCode));
  }

  private async stopService(service: Service) {
    if (this.config.gracefulShutdown) {
      const dependents = this.services.filter(({ config }) =>
        config.dependencies.includes(service.id)
      );
      await Promise.all(dependents.map((service) => this.stopService(service)));
    }
    await service.stop(this.config.windowsCtrlCShutdown);
  }
}

function never(): Promise<never> {
  return new Promise<never>(() => {});
}
