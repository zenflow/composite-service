import { promisify } from "util";
import stream from "stream";
import { ReadyContext } from "./interfaces/ReadyContext";
import { onceTcpPortUsed } from "./util/onceTcpPortUsed";
import { onceHttpOk } from "./util/onceHttpOk";
import { onceOutputLine } from "./util/onceOutputLine";

const delay = promisify(setTimeout);

export function createReadyContext(output: stream.Readable): ReadyContext {
  return {
    onceTcpPortUsed,
    onceHttpOk,
    onceOutputLineIs: line => onceOutputLine(output, l => l === line),
    onceOutputLineIncludes: text => onceOutputLine(output, l => l.includes(text)),
    onceOutputLine: test => onceOutputLine(output, test),
    onceDelay: milliseconds => delay(milliseconds),
  };
}
