import { PassThrough } from "stream";

export type LogLevel = "debug" | "info" | "error";

const orderedLogLevels: LogLevel[] = ["error", "info", "debug"];

export class Logger {
  private level: LogLevel;
  public readonly output = new PassThrough({ objectMode: true });
  constructor(level: LogLevel) {
    this.level = level;
  }
  public log(level: LogLevel, text: string) {
    if (this.shouldLog(level)) {
      for (const line of text.split("\n")) {
        this.output.write(` (${level}) ${line}\n`);
      }
    }
  }
  private shouldLog(level: LogLevel) {
    return orderedLogLevels.indexOf(level) <= orderedLogLevels.indexOf(this.level);
  }
}
