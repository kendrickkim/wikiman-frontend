<template>
  <div class="tui-holder" :class="{ 'tui-holder--no-toolbar': hideToolbar }">
    <div ref="holder" />
  </div>
</template>

<script setup>
import { getLocale, useI18n } from '@/i18n'

const { t } = useI18n()
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css'
import { api, getErrorMessage } from '@/utils/api'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({
  hideToolbar: { type: Boolean, default: false },
  height: { type: String, default: '480px' }
})

const model = defineModel({ type: String, default: '' })
const $q = useQuasar()
const settings = useSettingsStore()
const holder = ref(null)
let editor = null
let applying = false

async function uploadImage(blob) {
  const form = new FormData()
  form.append('image', blob, blob.name || 'image.png')
  const { data } = await api.post('/uploads', form)
  const url = data.file?.url || data.url
  if (!url) throw new Error(t('remaining.k031'))
  return url
}

function selectedText() {
  return editor?.getSelectedText?.() || ''
}

function insertLink({ href, label }) {
  if (!editor) return
  editor.exec('addLink', { linkUrl: href, linkText: label || href })
  editor.focus()
}

defineExpose({ selectedText, insertLink })

onMounted(async () => {
  const editorLocale = getLocale().startsWith('en') ? 'en-US' : 'ko-KR'
  const languagePack = editorLocale === 'ko-KR'
    ? import('@toast-ui/editor/dist/i18n/ko-kr')
    : Promise.resolve()
  const [{ default: Editor }] = await Promise.all([
    import('@toast-ui/editor'),
    languagePack
  ])
  if (!holder.value) return
  editor = new Editor({
    el: holder.value,
    height: props.height,
    initialEditType: 'wysiwyg',
    previewStyle: 'vertical',
    initialValue: model.value || '',
    language: editorLocale,
    usageStatistics: false,
    theme: settings.isDark ? 'dark' : 'light',
    placeholder: t('remaining.k032'),
    hideModeSwitch: props.hideToolbar,
    ...(props.hideToolbar ? { toolbarItems: [] } : {}),
    hooks: {
      async addImageBlobHook(blob, callback) {
        try {
          const url = await uploadImage(blob)
          callback(url, blob.name || '')
        } catch (err) {
          $q.notify({ type: 'negative', message: getErrorMessage(err, t('remaining.k031')) })
        }
      }
    },
    events: {
      change() {
        if (applying || !editor) return
        model.value = editor.getMarkdown()
      }
    }
  })
})

watch(() => settings.isDark, (dark) => {
  const root = holder.value?.querySelector('.toastui-editor-defaultUI')
  root?.classList.toggle('toastui-editor-dark', dark)
})

watch(model, (value) => {
  if (!editor) return
  if (editor.getMarkdown() === (value || '')) return
  applying = true
  editor.setMarkdown(value || '', false)
  applying = false
})

onBeforeUnmount(() => {
  editor?.destroy()
  editor = null
})
</script>

<style scoped>
.tui-holder--no-toolbar :deep(.toastui-editor-defaultUI-toolbar),
.tui-holder--no-toolbar :deep(.toastui-editor-toolbar),
.tui-holder--no-toolbar :deep(.toastui-editor-mode-switch),
.tui-holder--no-toolbar :deep(.toastui-editor-dropdown-toolbar) {
  display: none !important;
}

.tui-holder--no-toolbar :deep(.toastui-editor-defaultUI .ProseMirror) {
  padding: 8px 10px;
  height: 100%;
}

.tui-holder--no-toolbar :deep(.toastui-editor-ww-container .toastui-editor-contents),
.tui-holder--no-toolbar :deep(.toastui-editor-md-container .toastui-editor-md-preview) {
  padding: 8px 10px 0;
}

.tui-holder--no-toolbar :deep(.toastui-editor-contents p) {
  margin: 4px 0;
}

.tui-holder :deep(.ProseMirror),
.tui-holder :deep([contenteditable='true']) {
  -webkit-user-select: text;
  user-select: text;
}
</style>
