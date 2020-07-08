import { ServiceCrash } from './ServiceCrash'

/**
 * Context object given as argument to each {@link ServiceConfig.onCrash} function
 *
 * @public
 */
export interface OnCrashContext {
  /**
   * Whether the service became ready
   * (as determined by its {@link ServiceConfig.ready | ready config})
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
