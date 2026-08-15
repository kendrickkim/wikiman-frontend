import { normalizeEditorType } from './editors.js'
import { EMPTY_EDITORJS, hasEditorContent } from './editorConvert.js'

export function emptyQuickPostContent(editorType) {
  return normalizeEditorType(editorType, 'textarea') === 'editorjs' ? EMPTY_EDITORJS : ''
}

export function hasQuickPostContent(content, editorType) {
  return hasEditorContent(content, normalizeEditorType(editorType, 'textarea'))
}
