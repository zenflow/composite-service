import { ServiceConfig } from "./ServiceConfig";

/**
 * Configuration for a composite service
 */
export interface CompositeServiceConfig {
  /**
   * Level of detail in logging.
   * Defaults to `'info'`.
   */
  logLevel?: "debug" | "info" | "error";

  /**
   * If `true` then when shutting down,
   * each service will be stopped *only after* all services that depend on it have been stopped.
   * Defaults to `false`.
   *
   * This option will be ignored when running on Windows and {@link CompositeServiceConfig.windowsCtrlCShutdown} is `true`.
   */
  gracefulShutdown?: boolean;

  /**
   * If `true` then when shutting down *on Windows*,
   * all services will be signalled to stop with a single CTRL_C_EVENT.
   * Defaults to `false`.
   *
   * This allows each service to clean up & exit gracefully,
   * as they would an a UNIX-based system, instead of terminated them abruptly.
   *
   * The main limitation of Windows's CTRL_C_EVENT
   * is that it can only target the current console (& every process attached),
   * and can not target an individual process.
   *
   * Because of this limitation, some caveats apply when the method is used (only when running on Windows):
   *
   * 1. The {@link CompositeServiceConfig.gracefulShutdown} option will be ignored since
   * it requires the ability to signal each process at a different time.
   *
   * 2. Any additional parent processes (or any processes at all)
   * attached to the same console will receive the CTRL_C_EVENT signal,
   * not just the service processes.
   */
  windowsCtrlCShutdown?: boolean;

  /**
   * Configuration to use as defaults for every service.
   * Defaults to `{}`.
   */
  serviceDefaults?: ServiceConfig;

  /**
   * Configuration for each specific service.
   *
   * Each key is used as the service ID,
   * and each entry value is a {@link ServiceConfig}.
   *
   * Entries with falsy values are ignored.
   */
  services: {
    [id: string]: ServiceConfig | false | null | undefined | 0 | "";
  };
}
