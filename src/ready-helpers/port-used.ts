import { waitUntilUsedOnHost } from 'tcp-port-used'

/**
 * Waits until the given `port` (on the given `host`) is accepting connections
 *
 * @remarks
 *
 * Works by trying to connect to the given port
 * (as opposed to trying to listen on the given port)
 * every 250 milliseconds.
 *
 * @param port -
 * @param host - Defaults to `'localhost'`
 *
 * @example
 *
 * ```js
 * const { onceTcpPortUsed } = require('composite-service')
 *
 * const myServiceConfig = {
 *   command: 'node server.js',
 *   env: { PORT: 3000 },
 *   ready: () => onceTcpPortUsed(3000),
 * }
 * ```
 *
 * @public
 */
export async function onceTcpPortUsed(
  port: number | string,
  host = 'localhost',
): Promise<void> {
  const portNumber = typeof port === 'number' ? port : parseInt(port, 10)
  await waitUntilUsedOnHost(portNumber, host, 250, 2147483647)
}
