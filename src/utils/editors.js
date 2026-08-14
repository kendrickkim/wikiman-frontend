export const EDITOR_OPTIONS = [
  { label: 'CKEditor', value: 'ckeditor' },
  { label: 'Summernote', value: 'summernote' },
  { label: 'Editor.js', value: 'editorjs' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'HTML', value: 'html' }
]

export function normalizeEditorType(value, fallback = 'ckeditor') {
  if (value === 'ckeditor' || value === 'summernote' || value === 'markdown' || value === 'html' || value === 'editorjs') return value
  return fallback
}
