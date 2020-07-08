/**
 * Any `lines` having any stack trace(s) should be piped through this function before snapshotting,
 * since the file paths in stack traces will vary from system to system.
 */
export function redactStackTraces(input: string[]) {
  const output = [...input]
  let stackTrace: FindStackTraceResult = false
  while ((stackTrace = findStackTrace(output))) {
    output.splice(stackTrace.start, stackTrace.length, '--- stack trace ---')
  }
  return output
}

type FindStackTraceResult =
  | {
      start: number
      length: number
    }
  | false
const isStackTraceLine = (line: string) => line.startsWith('    at ')
function findStackTrace(lines: string[]): FindStackTraceResult {
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
