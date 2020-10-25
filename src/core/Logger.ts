import { PassThrough } from 'stream'
import chalk from 'chalk'

export type LogLevel = 'debug' | 'info' | 'error'

const orderedLogLevels: LogLevel[] = ['error', 'info', 'debug']
const logLevelColors = { error: 'red', info: 'teal', debug: 'yellow' }

export class Logger {
  private level: LogLevel
  public readonly output = new PassThrough({ objectMode: true })
  constructor(level: LogLevel) {
    this.level = level
  }
  public log(level: LogLevel, text: string) {
    if (this.shouldLog(level)) {
      const label = chalk.keyword(logLevelColors[level])(`(${level})`)
      for (const line of text.split('\n')) {
        this.output.write(` ${label} ${line}\n`)
      }
    }
  }
  private shouldLog(level: LogLevel) {
    return (
      orderedLogLevels.indexOf(level) <= orderedLogLevels.indexOf(this.level)
    )
  }
}
