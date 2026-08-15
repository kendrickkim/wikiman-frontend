import { t } from '../i18n/index.js'

const EDITOR_DEFINITIONS = [
  { labelKey: 'editors.textarea', value: 'textarea' },
  { labelKey: 'editors.ckeditor', value: 'ckeditor' },
  { labelKey: 'editors.summernote', value: 'summernote' },
  { labelKey: 'editors.tui', value: 'tui' },
  { labelKey: 'editors.editorjs', value: 'editorjs' },
  { labelKey: 'editors.markdown', value: 'markdown' },
  { labelKey: 'editors.html', value: 'html' }
]

export function editorOptions() {
  return EDITOR_DEFINITIONS.map(({ labelKey, value }) => ({
    label: t(labelKey),
    value
  }))
}

export const EDITOR_OPTIONS = EDITOR_DEFINITIONS.map(({ labelKey, value }) => ({
  labelKey,
  value,
  get label() {
    return t(labelKey)
  }
}))

const EDITOR_TYPES = new Set(EDITOR_OPTIONS.map((option) => option.value))

export function normalizeEditorType(value, fallback = 'ckeditor') {
  return EDITOR_TYPES.has(value) ? value : fallback
}
