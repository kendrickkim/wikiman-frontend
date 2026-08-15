import { normalizeEditorType } from './editors.js'

const EMPTY_EDITORJS = '{"blocks":[]}'

export function emptyQuickPostContent(editorType) {
  return normalizeEditorType(editorType, 'textarea') === 'editorjs' ? EMPTY_EDITORJS : ''
}

export function hasQuickPostContent(content, editorType) {
  const type = normalizeEditorType(editorType, 'textarea')
  if (type === 'editorjs') {
    try {
      const blocks = JSON.parse(content || EMPTY_EDITORJS).blocks
      return Array.isArray(blocks) && blocks.some((block) => {
        if (!block || typeof block !== 'object') return false
        const data = block.data || {}
        if (typeof data.text === 'string' && data.text.replace(/<[^>]+>/g, '').trim()) return true
        if (typeof data.caption === 'string' && data.caption.trim()) return true
        if (data.file?.url) return true
        if (Array.isArray(data.items) && data.items.length) return true
        if (typeof data.code === 'string' && data.code.trim()) return true
        return Boolean(data.url || data.link || data.content)
      })
    } catch {
      return false
    }
  }
  return String(content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .length > 0
}
