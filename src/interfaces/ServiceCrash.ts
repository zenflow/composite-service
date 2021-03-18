/**
 * Represents the event of a composed service crashing
 */
export interface ServiceCrash {
  /**
   * When the crash happened
   */
  date: Date
  /**
   * Tail of the process's log output
   *
   * Maximum length is determined by {@link ServiceConfig.logTailLength}.
   */
  logTail: string[]
}
