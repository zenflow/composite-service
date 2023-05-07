import { request, RequestOptions } from "http";
import { once } from "events";
import { onceAsyncTest } from "./onceAsyncTest";

export async function onceHttpOk(
  requestOptions: { url?: string | undefined } & RequestOptions,
  expectedStatus = 200
): Promise<void> {
  const { url, ...options } = requestOptions;
  return onceAsyncTest(250, async () => {
    const req = url ? request(url, options) : request(options);
    req.end();
    try {
      const res = (await once(req, "response"))[0];
      res.destroy();
      return res.statusCode === expectedStatus;
    } catch (error) {
      if (["ECONNREFUSED", "ETIMEDOUT", "ECONNRESET"].includes((error as any).code)) {
        return false;
      }
      throw error;
    } finally {
      req.destroy();
    }
  });
}
