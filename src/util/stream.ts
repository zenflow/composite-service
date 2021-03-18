import { Transform } from "stream";

export function mapStreamLines(callback: (line: string) => string): Transform {
  return new Transform({
    objectMode: true,
    transform(line: string, _, cb) {
      this.push(callback(line));
      cb();
    },
  });
}

export function tapStreamLines(callback: (line: string) => void): Transform {
  return new Transform({
    objectMode: true,
    transform(line: string, _, cb) {
      callback(line);
      this.push(line);
      cb();
    },
  });
}

export function filterBlankLastLine(blankLine: string): Transform {
  let bufferedBlankChunk = false;
  return new Transform({
    objectMode: true,
    transform(line: string, _, callback) {
      if (bufferedBlankChunk) {
        this.push(blankLine);
        bufferedBlankChunk = false;
      }
      if (line === blankLine) {
        bufferedBlankChunk = true;
      } else {
        this.push(line);
      }
      callback();
    },
  });
}
