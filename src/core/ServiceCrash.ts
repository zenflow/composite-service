/**
 * Represents the event of a composed service crashing
 *
 * @public
 */
export interface ServiceCrash {
  /**
   * When the crash happened
   */
  date: Date
  /**
   * Tail of the service's log output
   *
   * @remarks
   *
   * Maximum length is determined by {@link ServiceConfig.logTailLength}.
   */
  logTail: string[]
}
