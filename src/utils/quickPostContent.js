import { normalizeEditorType } from './editors.js'
import { EMPTY_EDITORJS, convertEditorContent, hasEditorContent } from './editorConvert.js'

const IMAGE_EXT_RE = /\.(?:png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i
const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\(\s*<?([^\s)>]+)>?[^)]*\)/g
const HTML_IMAGE_TAG_RE = /<img\b[^>]*>/gi
const HTML_IMAGE_SRC_RE = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi
const BARE_IMAGE_RE = /(?:https?:\/\/|\/)[^\s"'<>()[\]]+\.(?:png|jpe?g|gif|webp|svg|avif|bmp|ico)(?:\?[^\s"'<>()[\]]*)?/gi

export function emptyQuickPostContent(editorType) {
  return normalizeEditorType(editorType, 'textarea') === 'editorjs' ? EMPTY_EDITORJS : ''
}

export function hasQuickPostContent(content, editorType) {
  return hasEditorContent(content, normalizeEditorType(editorType, 'textarea'))
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/gi, '&')
}

/** 화면에 그려도 안전한 이미지 주소만 통과시킵니다. */
function normalizeImageSrc(raw) {
  const value = decodeEntities(raw).trim()
  if (!value) return ''
  if (/^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=\s]+$/i.test(value)) return value
  if (!/^(?:https?:\/\/|\/\/|\/)/i.test(value) && /^[a-z][a-z0-9+.-]*:/i.test(value)) return ''
  return IMAGE_EXT_RE.test(value.split(/[?#]/)[0]) ? value : ''
}

function editorJsBlocks(content) {
  const raw = String(content || '').trim()
  if (!raw.startsWith('{') && !raw.startsWith('[')) return null
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return Array.isArray(parsed?.blocks) ? parsed.blocks : null
  } catch {
    return null
  }
}

/** 간단 포스트 본문에 들어 있는 이미지 주소를 등장 순서대로 모읍니다. */
export function extractQuickPostImages(content, { limit = 6 } = {}) {
  const raw = String(content || '')
  const blocks = editorJsBlocks(raw)
  const candidates = []

  if (blocks) {
    for (const [order, block] of blocks.entries()) {
      if (String(block?.type || '').toLowerCase() !== 'image') continue
      candidates.push([order, block?.data?.file?.url || block?.data?.url || ''])
    }
  } else {
    for (const match of raw.matchAll(HTML_IMAGE_SRC_RE)) {
      candidates.push([match.index, match[1] ?? match[2] ?? match[3] ?? ''])
    }
    for (const match of raw.matchAll(MARKDOWN_IMAGE_RE)) candidates.push([match.index, match[1] || ''])
    for (const match of raw.matchAll(BARE_IMAGE_RE)) candidates.push([match.index, match[0]])
    candidates.sort((a, b) => a[0] - b[0])
  }

  const found = []
  const seen = new Set()
  for (const [, value] of candidates) {
    if (found.length >= limit) break
    const src = normalizeImageSrc(value)
    if (!src || seen.has(src)) continue
    seen.add(src)
    found.push(src)
  }

  return found
}

/** 이미지 마크업을 걷어낸 본문 텍스트입니다. 이미지는 따로 미리보기로 보여 줍니다. */
export function quickPostPlainText(content) {
  const source = editorJsBlocks(content)
    ? convertEditorContent(content, 'editorjs', 'textarea')
    : String(content || '')

  return source
    .replace(MARKDOWN_IMAGE_RE, '')
    .replace(HTML_IMAGE_TAG_RE, '')
    .replace(BARE_IMAGE_RE, (match) => (normalizeImageSrc(match) ? '' : match))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function appendPlain(content, text) {
  const current = String(content || '')
  if (!current) return text
  return `${current}${/\s$/.test(current) ? '' : ' '}${text}`
}

export function appendQuickPostSpeech(content, editorType, transcript) {
  const text = String(transcript || '').trim()
  const type = normalizeEditorType(editorType, 'textarea')
  if (!text) return content

  if (type === 'editorjs') {
    try {
      const parsed = JSON.parse(content || EMPTY_EDITORJS)
      const blocks = Array.isArray(parsed?.blocks) ? parsed.blocks : []
      return JSON.stringify({
        ...parsed,
        blocks: [...blocks, { type: 'paragraph', data: { text: escapeHtml(text) } }]
      })
    } catch {
      return JSON.stringify({
        blocks: [{ type: 'paragraph', data: { text: escapeHtml(text) } }]
      })
    }
  }

  if (['ckeditor', 'summernote', 'html'].includes(type)) {
    const current = String(content || '')
    return `${current}${current ? '\n' : ''}<p>${escapeHtml(text)}</p>`
  }

  return appendPlain(content, text)
}
