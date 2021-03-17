import { promisify } from 'util'
import stream from 'stream'
import { ReadyContext } from './interfaces/ReadyContext'
import { onceTcpPortUsed } from './util/onceTcpPortUsed'

const delay = promisify(setTimeout)

export function createReadyContext(output: stream.Readable): ReadyContext {
  return {
    onceTcpPortUsed,
    onceOutputLineIs: line => onceOutputLine(output, l => l === line),
    onceOutputLineIncludes: text =>
      onceOutputLine(output, l => l.includes(text)),
    onceOutputLine: test => onceOutputLine(output, test),
    onceDelay: milliseconds => delay(milliseconds),
  }
}

function onceOutputLine(
  output: stream.Readable,
  test: (line: string) => boolean,
): Promise<void> {
  return new Promise<void>(resolve => {
    const handler = (line: string) => {
      if (test(line)) {
        output.off('data', handler)
        resolve()
      }
    }
    output.on('data', handler)
  })
}
