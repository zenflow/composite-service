/**
 * Any `lines` having a stack trace should be piped through this function before snapshotting,
 * since the file paths in stack traces will vary from system to system.
 */
export function redactStackTrace(lines: string[]) {
  const isStackTraceLine = (line: string) => line.startsWith('    at ')
  const stackTraceStart = lines.findIndex(isStackTraceLine)
  if (stackTraceStart === -1) {
    return lines
  }
  let stackTraceLength = lines
    .slice(stackTraceStart)
    .findIndex((line: string) => !isStackTraceLine(line))
  stackTraceLength =
    stackTraceLength === -1 ? lines.length - stackTraceStart : stackTraceLength
  return [
    ...lines.slice(0, stackTraceStart),
    '--- stack trace ---',
    ...lines.slice(stackTraceStart + stackTraceLength),
  ]
}
