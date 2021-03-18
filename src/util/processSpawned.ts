import { ChildProcessWithoutNullStreams } from "child_process";
import { once } from "events";
import { promisify } from "util";

const delay = promisify(setTimeout);

export async function processSpawned(process: ChildProcessWithoutNullStreams) {
  if (isSpawnEventSupported()) {
    await once(process, "spawn");
  } else {
    await Promise.race([
      delay(100),
      once(process, "error").then(([error]) => Promise.reject(error)),
    ]);
  }
}

function isSpawnEventSupported() {
  const [major, minor, patch] = process.versions.node.split(".").map(s => Number(s));
  return major > 15 || (major === 15 && minor >= 1 && patch >= 0);
}
