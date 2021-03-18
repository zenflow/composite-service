import { promisify } from "util";
import { Socket } from "net";

const delay = promisify(setTimeout);

export async function onceTcpPortUsed(port: number | string, host = "localhost"): Promise<void> {
  const portNumber = typeof port === "number" ? port : parseInt(port, 10);
  while (true) {
    if (await isTcpPortUsed(portNumber, host)) {
      return;
    } else {
      await delay(250);
    }
  }
}

function isTcpPortUsed(port: number, host: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    socket.once("connect", () => {
      resolve(true);
      cleanUp();
    });
    socket.once("error", error => {
      if (["ECONNREFUSED", "ETIMEDOUT"].includes((error as any).code)) {
        resolve(false);
      } else {
        reject(error);
      }
      cleanUp();
    });
    function cleanUp() {
      socket.removeAllListeners();
      socket.end();
      socket.destroy();
      socket.unref();
    }
    socket.connect(port, host);
  });
}
