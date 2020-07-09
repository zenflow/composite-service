import { PassThrough } from 'stream'

export type LogLevel = 'debug' | 'info' | 'error'

const orderedLogLevels: LogLevel[] = ['debug', 'info', 'error']

export function isValidLogLevel(string: string) {
  return (orderedLogLevels as string[]).includes(string)
}

export class Logger {
  public readonly output = new PassThrough({ objectMode: true })
  public readonly debug: (text: string) => void
  public readonly info: (text: string) => void
  public readonly error: (text: string) => void
  private level: LogLevel
  constructor(level: LogLevel) {
    this.level = level
    this.debug = this.log.bind(this, 'debug')
    this.info = this.log.bind(this, 'info')
    this.error = this.log.bind(this, 'error')
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
      orderedLogLevels.indexOf(level) >= orderedLogLevels.indexOf(this.level)
    )
  }
}
