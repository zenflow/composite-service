import { promisify } from 'util'
import { Socket } from 'net'

const delay = promisify(setTimeout)

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
  while (true) {
    if (await isTcpPortUsed(portNumber, host)) {
      return
    } else {
      await delay(250)
    }
  }
}

function isTcpPortUsed(port: number, host: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const socket = new Socket()
    socket.once('connect', () => {
      resolve(true)
      cleanUp()
    })
    socket.once('error', error => {
      if (['ECONNREFUSED', 'ETIMEDOUT'].includes((error as any).code)) {
        resolve(false)
      } else {
        reject(error)
      }
      cleanUp()
    })
    function cleanUp() {
      socket.removeAllListeners()
      socket.end()
      socket.destroy()
      socket.unref()
    }
    socket.connect(port, host)
  })
}
