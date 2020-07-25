import { promisify } from 'util'

const delay = promisify(setTimeout)

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
export async function onceTimeout(milliseconds: number): Promise<void> {
  await delay(milliseconds)
}
