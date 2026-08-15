const IMAGE_EXT_RE = /\.(?:png|jpe?g|gif|webp|svg|ico|bmp|avif)(?:\?.*)?$/i
const TRACKING_PARAM_RE = /^(?:utm_.*|rc|ntype|sid|sl|fbclid|gclid|mc_eid|ref)$/i

function decodeBasicEntities(value) {
  return String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2f;/gi, '/')
    .replace(/&#47;/g, '/')
}

function cleanUrl(raw) {
  let value = decodeBasicEntities(raw).trim()
  // HTML 속성에 남은 &amp;가 더 있으면 한 번 더 풀어준다.
  if (value.includes('&amp;')) value = decodeBasicEntities(value)
  return value.replace(/[),.;!?]+$/g, '')
}

export function normalizeUrlKey(raw) {
  const cleaned = cleanUrl(raw)
  if (!cleaned) return ''
  try {
    const url = new URL(cleaned)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    url.hash = ''
    url.username = ''
    url.password = ''
    url.hostname = url.hostname.toLowerCase()
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1)
    }
    const params = [...url.searchParams.entries()]
      .filter(([key]) => !TRACKING_PARAM_RE.test(key))
      .sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]))
    url.search = ''
    for (const [key, value] of params) url.searchParams.append(key, value)
    return url.toString()
  } catch {
    return cleaned.toLowerCase()
  }
}

export function internalRouteForUrl(raw, currentOrigin) {
  const cleaned = cleanUrl(raw)
  const origin = String(currentOrigin || '').trim()
  if (!cleaned || !origin) return ''
  try {
    const target = new URL(cleaned, origin)
    const current = new URL(origin)
    if (!['http:', 'https:'].includes(target.protocol) || target.origin !== current.origin) return ''
    return `${target.pathname}${target.search}${target.hash}` || '/'
  } catch {
    return ''
  }
}

function isImageUrl(raw) {
  try {
    return IMAGE_EXT_RE.test(new URL(cleanUrl(raw)).pathname)
  } catch {
    return IMAGE_EXT_RE.test(String(raw || ''))
  }
}

function pushUrl(found, seen, raw) {
  const cleaned = cleanUrl(raw)
  const key = normalizeUrlKey(cleaned)
  if (!key || seen.has(key) || isImageUrl(cleaned)) return false
  seen.add(key)
  found.push(cleaned)
  return true
}

function collectMatches(text, re, groupIndexes) {
  const out = []
  const local = new RegExp(re.source, re.flags)
  let match
  while ((match = local.exec(text))) {
    for (const index of groupIndexes) {
      if (match[index]) {
        out.push(match[index])
        break
      }
    }
  }
  return out
}

export function extractUrls(text, { limit = 5 } = {}) {
  const raw = decodeBasicEntities(text)
  const found = []
  const seen = new Set()

  for (const href of collectMatches(raw, /\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi, [1, 2, 3])) {
    if (!/^https?:\/\//i.test(href)) continue
    if (pushUrl(found, seen, href) && found.length >= limit) return found
  }

  for (const href of collectMatches(raw, /<(https?:\/\/[^>\s]+)>/gi, [1])) {
    if (pushUrl(found, seen, href) && found.length >= limit) return found
  }

  for (const href of collectMatches(raw, /(?<!!)\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/gi, [2])) {
    if (pushUrl(found, seen, href) && found.length >= limit) return found
  }

  const stripped = raw
    .replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, ' ')
    .replace(/\bsrc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/(?<!!)\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/gi, ' ')
    .replace(/<(https?:\/\/[^>\s]+)>/gi, ' ')

  const bare = new RegExp(/https?:\/\/[^\s<>"'`\]]+/gi.source, 'gi')
  let match
  while ((match = bare.exec(stripped))) {
    if (pushUrl(found, seen, match[0]) && found.length >= limit) return found
  }

  return found
}
