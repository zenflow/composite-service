/* This file contains helpers to redact bits of text from console `lines`
    so that we have something consistent that we can snapshot. */

import path from 'path'

export function redactStackTraces(lines: string[]) {
  const output = [...lines]
  let stackTrace: StackTrace | false = false
  while ((stackTrace = findStackTrace(output))) {
    output.splice(stackTrace.start, stackTrace.length, '<stack trace>')
  }
  return output
}

type StackTrace = {
  start: number
  length: number
}
const isStackTraceLine = (line: string) => line.startsWith('error:     at ')
function findStackTrace(lines: string[]): StackTrace | false {
  const start = lines.findIndex(isStackTraceLine)
  if (start === -1) {
    return false
  }
  let length = lines
    .slice(start)
    .findIndex((line: string) => !isStackTraceLine(line))
  length = length === -1 ? lines.length - start : length
  return { start, length }
}

export function redactEscapedCwdInstances(lines: string[]) {
  const cwd = path.join(process.cwd(), path.sep)
  const escapedCwd = JSON.stringify(cwd).slice(1, -1)
  return lines.map(line => {
    let result = line
    while (result.includes(escapedCwd)) {
      result = result.replace(escapedCwd, '<cwd>')
    }
    return result
  })
}
