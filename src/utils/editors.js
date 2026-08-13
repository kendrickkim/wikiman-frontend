export const EDITOR_OPTIONS = [
  { label: 'CKEditor', value: 'ckeditor' },
  { label: 'Editor.js', value: 'editorjs' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'HTML', value: 'html' }
]

export function normalizeEditorType(value, fallback = 'ckeditor') {
  if (value === 'ckeditor' || value === 'markdown' || value === 'html' || value === 'editorjs') return value
  return fallback
}
