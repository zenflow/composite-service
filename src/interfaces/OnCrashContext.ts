import { ServiceCrash } from "./ServiceCrash";

/**
 * Context object given as argument to each {@link ServiceConfig.onCrash} function
 */
export interface OnCrashContext {
  /**
   * ID of the service that crashed
   */
  serviceId: string;

  /**
   * Whether the service became ready according to its {@link ServiceConfig.ready} function
   */
  isServiceReady: boolean;

  /**
   * Object representing the crash
   */
  crash: ServiceCrash;

  /**
   * Objects representing latest crashes, ordered from oldest to newest
   *
   * Maximum length is determined by {@link ServiceConfig.crashesLength}.
   */
  crashes: ServiceCrash[];
}
