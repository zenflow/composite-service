import { ServiceCrash } from './ServiceCrash'

/**
 * Context object given as argument to each {@link ServiceConfig.onCrash} function
 */
export interface OnCrashContext {
  /**
   * ID of the service that crashed
   */
  serviceId: string

  /**
   * Whether the service became ready according to its {@link ServiceConfig.ready} function
   */
  isServiceReady: boolean

  /**
   * Object representing the crash
   */
  crash: ServiceCrash

  /**
   * Array of objects representing all crashes, past and present
   */
  crashes: ServiceCrash[]
}
