export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Both sources are ordinary server-rendered pages; a browser User-Agent is all they ask
 * for. Retries are for transient network failures, not for working around a block. */
export async function fetchPage(url) {
  const delays = [0, 2000, 5000]
  let lastError
  for (const delay of delays) {
    if (delay) await sleep(delay)
    try {
      const res = await fetch(url, {
        headers: { "user-agent": USER_AGENT, "accept-language": "en-IN,en;q=0.9" },
        redirect: "follow",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (err) {
      lastError = err
    }
  }
  throw new Error(`Could not fetch ${url}: ${lastError?.message ?? "unknown error"}`)
}
