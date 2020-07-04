import { ComposedServiceCrash } from './ComposedServiceCrash'

/**
 * Context object given as argument to the
 * {@link ComposedServiceConfig.handleCrash | ComposedServiceConfig.handleCrash function}
 *
 * @public
 */
export interface HandleCrashConfigContext {
  /**
   * Whether the service became ready
   * (as determined by its {@link ComposedServiceConfig.ready | ready config})
   */
  isServiceReady: boolean

  /**
   * Object representing the crash
   */
  crash: ComposedServiceCrash

  /**
   * Array of objects representing all crashes, past and present
   */
  crashes: ComposedServiceCrash[]
}
