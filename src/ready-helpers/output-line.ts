import stream from 'stream'

/**
 * Waits until `output` emits a `line` for which `test(line)` returns `true`
 *
 * @param output - To scan
 * @param test - To test each `line` from `output`
 *
 * @example
 *
 * ```js
 * const { onceOutputLine } = require('composite-service')
 *
 * const myServiceConfig = {
 *   command: 'node service.js',
 *   ready: ctx => onceOutputLine(ctx.output, line => line.match(/^Ready/)),
 * }
 * ```
 *
 * @public
 */
export function onceOutputLine(
  output: stream.Readable,
  test: (line: string) => boolean
) {
  return new Promise<void>(resolve => {
    output.on('data', line => {
      if (test(line)) resolve()
    })
  })
}

/**
 * Waits until `output` emits a line equal to (`===`) `value`
 *
 * @param output - To scan
 * @param value - To look for in `output`
 *
 * @example
 *
 * ```js
 * const { onceOutputLine } = require('composite-service')
 *
 * const myServiceConfig = {
 *   command: 'node service.js',
 *   ready: ctx => onceOutputLineIs(ctx.output, 'Ready.'),
 * }
 * ```
 *
 * @public
 */
export function onceOutputLineIs(output: stream.Readable, value: string) {
  return onceOutputLine(output, line => line === value)
}

/**
 * Waits until `output` emits a line that `.includes(value)`
 *
 * @param output - To scan
 * @param value - To look for within each line from `output`
 *
 * @example
 *
 * ```js
 * const { onceOutputLineIncludes } = require('composite-service')
 *
 * const myServiceConfig = {
 *   command: 'node service.js',
 *   ready: ctx => onceOutputLineIncludes(ctx.output, 'Ready'),
 * }
 * ```
 *
 * @public
 */
export function onceOutputLineIncludes(output: stream.Readable, value: string) {
  return onceOutputLine(output, line => line.includes(value))
}
