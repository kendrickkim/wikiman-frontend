export const EDITOR_OPTIONS = [
  { label: '텍스트', value: 'textarea' },
  { label: 'CKEditor', value: 'ckeditor' },
  { label: 'Summernote', value: 'summernote' },
  { label: 'TUI Editor', value: 'tui' },
  { label: 'Editor.js', value: 'editorjs' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'HTML', value: 'html' }
]

const EDITOR_TYPES = new Set(EDITOR_OPTIONS.map((option) => option.value))

export function normalizeEditorType(value, fallback = 'ckeditor') {
  return EDITOR_TYPES.has(value) ? value : fallback
}
