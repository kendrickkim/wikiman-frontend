const URL_RE = /https?:\/\/[^\s<>"'`]+/gi

export function extractUrls(text, { limit = 5 } = {}) {
  const raw = String(text || '')
  const found = []
  const seen = new Set()
  let match
  URL_RE.lastIndex = 0
  while ((match = URL_RE.exec(raw))) {
    let url = match[0].replace(/[),.;!?]+$/g, '')
    if (!url || seen.has(url)) continue
    seen.add(url)
    found.push(url)
    if (found.length >= limit) break
  }
  return found
}
