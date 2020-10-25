/* This file contains helpers to redact bits of text from console `lines`
    so that we have something consistent that we can snapshot. */

export function redactStackTraces(lines: string[]) {
  type StackTrace = {
    start: number
    length: number
  }

  const output = [...lines]
  let stackTrace: StackTrace | false = false
  while ((stackTrace = findStackTrace(output))) {
    output.splice(stackTrace.start, stackTrace.length, '<stack trace>')
  }
  return output

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
  function isStackTraceLine(line: string) {
    return line.startsWith(' (error)     at ') || line.startsWith('    at ')
  }
}

export function redactCwd(lines: string[]) {
  const cwd = process.cwd()
  return lines.map(line => {
    let result = line
    while (result.includes(cwd)) {
      result = result.replace(cwd, '<cwd>')
    }
    return result
  })
}

export function redactConfigDump(lines: string[]) {
  const start = lines.findIndex(line => line === ' (debug) Config: {')
  if (start === -1) {
    return lines
  }
  const end = lines.findIndex(line => line === ' (debug) }')
  if (end === -1) {
    return lines
  }
  return [...lines.slice(0, start), '<config dump>', ...lines.slice(end + 1)]
}
