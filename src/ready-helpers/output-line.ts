import { Readable } from 'stream'

export function onceOutputLine(
  output: Readable,
  test: (line: string) => boolean
) {
  return new Promise<void>(resolve => {
    output.on('data', line => {
      if (test(line)) resolve()
    })
  })
}

export function onceOutputLineIs(output: Readable, value: string) {
  return onceOutputLine(output, line => line === value)
}

export function onceOutputLineIncludes(output: Readable, value: string) {
  return onceOutputLine(output, line => line.includes(value))
}
