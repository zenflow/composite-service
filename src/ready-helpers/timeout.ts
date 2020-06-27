/**
 * Waits a predetermined length of time
 *
 * @param milliseconds - Length of time to wait
 *
 * @example
 *
 * ```js
 * const { onceTimeout } = require('composite-service')
 *
 * const myServiceConfig = {
 *   command: 'node service.js',
 *   ready: () => onceTimeout(1000),
 * }
 * ```
 *
 * @public
 */
export function onceTimeout(milliseconds: number) {
  return new Promise<void>(resolve => setTimeout(resolve, milliseconds))
}
