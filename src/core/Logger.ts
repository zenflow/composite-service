import { PassThrough } from 'stream'

export type LogLevel = 'debug' | 'info' | 'error'

export const orderedLogLevels: LogLevel[] = ['error', 'info', 'debug']

export class Logger {
  private level: LogLevel
  public readonly error: (text: string) => void
  public readonly info: (text: string) => void
  public readonly debug: (text: string) => void
  public readonly output = new PassThrough({ objectMode: true })
  constructor(level: LogLevel) {
    this.level = level
    this.error = this.log.bind(this, 'error')
    this.info = this.log.bind(this, 'info')
    this.debug = this.log.bind(this, 'debug')
  }
  private log(level: LogLevel, text: string) {
    if (this.shouldLog(level)) {
      for (const line of text.split('\n')) {
        this.output.write(`${level}: ${line}\n`)
      }
    }
  }
  private shouldLog(level: LogLevel) {
    return (
      orderedLogLevels.indexOf(level) <= orderedLogLevels.indexOf(this.level)
    )
  }
}
