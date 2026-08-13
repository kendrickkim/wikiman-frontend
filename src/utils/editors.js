export const EDITOR_OPTIONS = [
  { label: 'Editor.js', value: 'editorjs' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'HTML', value: 'html' }
]

export function normalizeEditorType(value, fallback = 'editorjs') {
  if (value === 'markdown' || value === 'html' || value === 'editorjs') return value
  return fallback
}
