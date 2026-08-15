import { renderMarkdown } from './markdown.js'

export const EMPTY_EDITORJS = '{"blocks":[]}'

const EDITOR_KINDS = {
  textarea: 'text',
  ckeditor: 'html',
  summernote: 'html',
  html: 'html',
  tui: 'markdown',
  markdown: 'markdown',
  editorjs: 'editorjs'
}

const KEEP_INLINE_TAGS = new Set(['a', 'b', 'strong', 'i', 'em', 'u', 's', 'del', 'mark', 'code', 'br'])

export function editorKind(editorType) {
  return EDITOR_KINDS[editorType] || 'html'
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function decodeEntities(text) {
  return String(text ?? '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/gi, '&')
}

function textToHtml(text) {
  const value = String(text ?? '')
  if (!value.trim()) return ''
  return value
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}

function htmlToText(html) {
  const value = String(html ?? '')
  if (!value.trim()) return ''
  return decodeEntities(
    value
      .replace(/<\s*(br|hr)\s*\/?>/gi, '\n')
      .replace(/<\/\s*(p|div|li|tr|h[1-6]|pre|blockquote|figure|figcaption)\s*>/gi, '\n')
      .replace(/<\s*li[^>]*>/gi, '- ')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function parseBlocks(content) {
  try {
    const parsed = JSON.parse(content || EMPTY_EDITORJS)
    if (Array.isArray(parsed)) return parsed
    return Array.isArray(parsed?.blocks) ? parsed.blocks : []
  } catch {
    return []
  }
}

function listItemContent(item) {
  if (typeof item === 'string') return item
  return item?.content ?? item?.text ?? ''
}

function listToHtml(items, style) {
  if (!Array.isArray(items) || !items.length) return ''
  const tag = style === 'ordered' ? 'ol' : 'ul'
  const body = items.map((item) => {
    const children = listToHtml(item?.items || [], style)
    return `<li>${listItemContent(item)}${children}</li>`
  }).join('')
  return `<${tag}>${body}</${tag}>`
}

function tableToHtml(data) {
  const rows = data?.content || data?.rows || []
  if (!rows.length) return ''
  const cellHtml = (cell) => {
    if (cell == null) return ''
    if (typeof cell === 'object') return String(cell.content ?? cell.text ?? '')
    return String(cell)
  }
  const head = data?.withHeadings
    ? `<thead><tr>${(rows[0] || []).map((cell) => `<th>${cellHtml(cell)}</th>`).join('')}</tr></thead>`
    : ''
  const bodyRows = data?.withHeadings ? rows.slice(1) : rows
  const body = `<tbody>${bodyRows.map((row) => (
    `<tr>${(row || []).map((cell) => `<td>${cellHtml(cell)}</td>`).join('')}</tr>`
  )).join('')}</tbody>`
  return `<table>${head}${body}</table>`
}

function editorjsToHtml(content) {
  return parseBlocks(content).map((block) => {
    const data = block?.data || {}
    switch (block?.type) {
      case 'header': {
        const level = Math.min(Math.max(Number(data.level) || 2, 1), 6)
        return `<h${level}>${data.text || ''}</h${level}>`
      }
      case 'list':
        return listToHtml(data.items || [], data.style || 'unordered')
      case 'code':
        return `<pre><code>${escapeHtml(data.code || '')}</code></pre>`
      case 'image': {
        const url = data.file?.url || data.url || ''
        if (!url) return data.caption ? `<p>${data.caption}</p>` : ''
        const caption = data.caption ? `<figcaption>${data.caption}</figcaption>` : ''
        return `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(data.caption || '')}">${caption}</figure>`
      }
      case 'table':
        return tableToHtml(data)
      case 'paragraph':
        return `<p>${data.text || ''}</p>`
      default: {
        const text = data.text || data.caption || data.code || ''
        return text ? `<p>${text}</p>` : ''
      }
    }
  }).filter(Boolean).join('\n')
}

function keepInlineOnly(html) {
  return String(html ?? '').replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (full, rawName) => {
    const name = String(rawName).toLowerCase()
    if (!KEEP_INLINE_TAGS.has(name)) return ''
    if (name === 'br') return '<br>'
    if (name === 'a') return full.startsWith('</') ? '</a>' : full
    return full.startsWith('</') ? `</${name}>` : `<${name}>`
  }).trim()
}

function paragraphBlock(text) {
  const value = String(text ?? '').trim()
  return value ? { type: 'paragraph', data: { text: value } } : null
}

function elementToBlocks(el) {
  const tag = el.tagName?.toLowerCase() || ''
  if (/^h[1-6]$/.test(tag)) {
    const text = keepInlineOnly(el.innerHTML)
    if (!text) return []
    return [{ type: 'header', data: { text, level: Number(tag.slice(1)) } }]
  }
  if (tag === 'pre') {
    const code = el.textContent || ''
    return code.trim() ? [{ type: 'code', data: { code } }] : []
  }
  if (tag === 'ul' || tag === 'ol') {
    return Array.from(el.querySelectorAll('li'))
      .map((li) => paragraphBlock(`- ${keepInlineOnly(li.innerHTML)}`))
      .filter(Boolean)
  }
  if (tag === 'img') {
    const url = el.getAttribute('src') || ''
    return url ? [{ type: 'image', data: { file: { url }, caption: el.getAttribute('alt') || '' } }] : []
  }
  if (tag === 'table' || tag === 'figure' || tag === 'blockquote' || tag === 'div' || tag === 'section') {
    const nested = Array.from(el.children)
    if (nested.length) return nested.flatMap((child) => elementToBlocks(child))
    return [paragraphBlock(keepInlineOnly(el.innerHTML))].filter(Boolean)
  }
  return [paragraphBlock(keepInlineOnly(el.innerHTML ?? el.textContent))].filter(Boolean)
}

function htmlToEditorjs(html) {
  const value = String(html ?? '')
  if (!value.trim()) return EMPTY_EDITORJS
  if (typeof DOMParser === 'undefined') {
    const blocks = htmlToText(value)
      .split(/\n{2,}/)
      .map((para) => paragraphBlock(escapeHtml(para).replace(/\n/g, '<br>')))
      .filter(Boolean)
    return JSON.stringify({ blocks })
  }
  const doc = new DOMParser().parseFromString(value, 'text/html')
  const blocks = Array.from(doc.body.children).flatMap((el) => elementToBlocks(el))
  if (!blocks.length) {
    const text = htmlToText(value)
    const fallback = paragraphBlock(escapeHtml(text).replace(/\n/g, '<br>'))
    return JSON.stringify({ blocks: fallback ? [fallback] : [] })
  }
  return JSON.stringify({ blocks })
}

function blockHasContent(block) {
  if (!block || typeof block !== 'object') return false
  const data = block.data || {}
  if (typeof data.text === 'string' && data.text.replace(/<[^>]+>/g, '').trim()) return true
  if (typeof data.caption === 'string' && data.caption.trim()) return true
  if (data.file?.url) return true
  if (Array.isArray(data.items) && data.items.length) return true
  if (typeof data.code === 'string' && data.code.trim()) return true
  return Boolean(data.url || data.link || data.content)
}

export function hasEditorContent(content, editorType) {
  if (editorKind(editorType) === 'editorjs') return parseBlocks(content).some(blockHasContent)
  return String(content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .length > 0
}

/**
 * 편집기를 바꿀 때 본문이 사라지지 않도록 형식을 옮깁니다.
 * 대상 형식으로 정확히 바꿀 수 없으면 HTML 그대로 넘깁니다.
 */
export function convertEditorContent(content, fromType, toType) {
  const from = editorKind(fromType)
  const to = editorKind(toType)
  const source = String(content ?? '')
  if (!source.trim() || (from === 'editorjs' && !parseBlocks(source).length)) {
    return to === 'editorjs' ? EMPTY_EDITORJS : ''
  }
  if (from === to) return source

  if (to === 'text') {
    if (from === 'markdown') return source
    if (from === 'editorjs') return htmlToText(editorjsToHtml(source))
    return htmlToText(source)
  }

  if (to === 'markdown') {
    if (from === 'text') return source
    if (from === 'editorjs') return editorjsToHtml(source)
    return source
  }

  if (to === 'editorjs') {
    if (from === 'text') return htmlToEditorjs(textToHtml(source))
    if (from === 'markdown') return htmlToEditorjs(renderMarkdown(source))
    return htmlToEditorjs(source)
  }

  if (from === 'text') return textToHtml(source)
  if (from === 'markdown') return renderMarkdown(source)
  if (from === 'editorjs') return editorjsToHtml(source)
  return source
}
