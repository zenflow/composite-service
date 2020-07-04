import fetch from 'node-fetch'

export async function fetchText(url: string) {
  const response = await fetch(url)
  if (response.status !== 200) {
    throw new Error(`http status ${response.status} fetching ${url}`)
  }
  return await response.text()
}
