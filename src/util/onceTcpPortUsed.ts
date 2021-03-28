import { Socket } from "net";
import { once } from "events";
import { onceAsyncTest } from "./onceAsyncTest";

export async function onceTcpPortUsed(port: number | string, host = "localhost"): Promise<void> {
  const portNumber = typeof port === "number" ? port : parseInt(port, 10);
  return onceAsyncTest(250, async () => {
    const socket = new Socket();
    socket.connect(portNumber, host);
    try {
      await once(socket, "connect");
      return true;
    } catch (error) {
      // TODO: ECONNRESET doesn't apply to raw tcp connection, right?
      if (["ECONNREFUSED", "ETIMEDOUT"].includes((error as any).code)) {
        return false;
      }
      throw error;
    } finally {
      socket.end();
      socket.destroy();
      socket.unref();
    }
  });
}
