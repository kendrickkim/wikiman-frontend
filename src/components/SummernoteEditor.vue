<template>
  <div class="summernote-holder">
    <textarea ref="element" />
  </div>
</template>

<script setup>
import { getLocale, useI18n } from '@/i18n'

const { t } = useI18n()
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import $ from 'jquery'
import 'summernote/dist/summernote-lite.css'
import { api, getErrorMessage } from '@/utils/api'

const model = defineModel({ type: String, default: '' })
const $q = useQuasar()
const element = ref(null)
let ready = false
let applying = false

async function uploadImage(file) {
  const form = new FormData()
  form.append('image', file)
  try {
    const { data } = await api.post('/uploads', form)
    const url = data.file?.url || data.url
    if (!url) throw new Error(t('remaining.k031'))
    $(element.value).summernote('insertImage', url, file.name || '')
  } catch (err) {
    throw new Error(getErrorMessage(err, t('remaining.k031')))
  }
}

function selectedText() {
  if (!ready) return ''
  $(element.value).summernote('saveRange')
  return window.getSelection()?.toString() || ''
}

function insertLink({ href, label }) {
  if (!ready) return
  $(element.value).summernote('restoreRange')
  $(element.value).summernote('createLink', {
    text: label || href,
    url: href,
    isNewWindow: /^https?:\/\//i.test(href)
  })
}

defineExpose({ selectedText, insertLink })

onMounted(async () => {
  window.$ = $
  window.jQuery = $
  // summernote 0.9는 jQuery 3의 $.now에 의존합니다.
  if (typeof $.now !== 'function') $.now = () => Date.now()
  await import('summernote/dist/summernote-lite.js')
  const editorLocale = getLocale().startsWith('en') ? 'en-US' : 'ko-KR'
  if (editorLocale === 'ko-KR') {
    await import('summernote/dist/lang/summernote-ko-KR.js')
  }
  $(element.value).summernote({
    lang: editorLocale,
    height: 420,
    minHeight: 240,
    placeholder: t('remaining.k032'),
    dialogsInBody: true,
    toolbar: [
      ['style', ['style']],
      ['font', ['bold', 'underline', 'clear']],
      ['para', ['ul', 'ol']],
      ['table', ['table']],
      ['insert', ['link', 'picture', 'hr']],
      ['view', ['fullscreen', 'codeview', 'help']]
    ],
    callbacks: {
      onChange(contents) {
        if (!applying) model.value = contents
      },
      async onImageUpload(files) {
        try {
          for (const file of Array.from(files || [])) {
            await uploadImage(file)
          }
        } catch (err) {
          $q.notify({ type: 'negative', message: err.message || t('remaining.k031') })
        }
      }
    }
  })
  ready = true
  applying = true
  $(element.value).summernote('code', model.value || '')
  applying = false
})

watch(model, (value) => {
  if (!ready) return
  const current = $(element.value).summernote('code')
  if (current === (value || '')) return
  applying = true
  $(element.value).summernote('code', value || '')
  applying = false
})

onBeforeUnmount(() => {
  if (ready) $(element.value).summernote('destroy')
  ready = false
})
</script>
