/**
 * Represents the event of a composed service crashing
 *
 * @public
 */
export interface ComposedServiceCrash {
  /**
   * When the crash happened
   */
  date: Date
  /**
   * Tail of the service's log output
   *
   * @remarks
   *
   * Maximum length is determined by {@link ComposedServiceConfig.logTailLength}.
   */
  logTail: string[]
}
