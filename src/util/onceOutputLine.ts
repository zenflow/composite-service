import stream from "stream";

export function onceOutputLine(
  output: stream.Readable,
  test: (line: string) => boolean
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const handler = (line: string) => {
      let testResult = false;
      try {
        testResult = test(line);
      } catch (error) {
        cleanup();
        reject(error);
        return;
      }
      if (testResult) {
        cleanup();
        resolve();
      }
    };
    output.on("data", handler);
    const cleanup = () => output.off("data", handler);
  });
}
