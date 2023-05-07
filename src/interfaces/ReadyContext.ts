import { RequestOptions } from "http";

/**
 * Context object given as argument to each {@link ServiceConfig.ready} function
 */
export interface ReadyContext {
  /**
   * Wait until the given TCP `port` (on the given `host`) is accepting connections.
   * The `port` is required.
   * The `host` defaults to "localhost".
   *
   * Works by repeatedly trying establish a TCP connection to the given port.
   */
  onceTcpPortUsed: (port: number | string, host?: string) => Promise<void>;

  /**
   * Wait until an expected http status is returned for the given request.
   *
   * The `requestOptions` requires at minimum a `url` or `port` property.
   * Default `method` is `"GET"` & default `path` is `"/"`.
   *
   * The default `expectedStatus` is `200`.
   *
   * Works by trying the http request repeatedly.
   */
  onceHttpOk: (
    requestOptions: { url?: string | undefined } & RequestOptions,
    expectedStatus?: number | undefined
  ) => Promise<void>;

  /**
   * Wait until a line in the console output passes custom `test`
   */
  onceOutputLine: (test: (line: string) => boolean) => Promise<void>;

  /**
   * Wait until a certain exact `line` appears in the console output
   */
  onceOutputLineIs: (line: string) => Promise<void>;

  /**
   * Wait until a line including `text` appears in the console output
   */
  onceOutputLineIncludes: (text: string) => Promise<void>;

  /**
   * Wait a predetermined length of time
   */
  onceDelay: (milliseconds: number) => Promise<void>;
}
