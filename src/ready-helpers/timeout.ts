export function onceTimeout(milliseconds: number) {
  return new Promise<void>(resolve => setTimeout(resolve, milliseconds))
}
