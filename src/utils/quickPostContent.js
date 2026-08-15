import { normalizeEditorType } from './editors.js'
import { EMPTY_EDITORJS, hasEditorContent } from './editorConvert.js'

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
