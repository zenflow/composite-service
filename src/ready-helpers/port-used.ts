import { waitUntilUsedOnHost } from 'tcp-port-used'

export async function oncePortUsed(port: number | string, host = 'localhost') {
  const portNumber = typeof port === 'number' ? port : parseInt(port, 10)
  await waitUntilUsedOnHost(portNumber, host, 250, 2147483647)
}
