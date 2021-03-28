import { promisify } from "util";

const delay = promisify(setTimeout);

export async function onceAsyncTest(
  minimumInterval: number,
  test: () => Promise<boolean>,
): Promise<void> {
  while (true) {
    const delayPromise = delay(minimumInterval);
    if (await test()) {
      return;
    }
    await delayPromise;
  }
}
