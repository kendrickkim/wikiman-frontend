<template>
  <div class="summernote-holder">
    <textarea ref="element" />
  </div>
</template>

<script setup>
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
    if (!url) throw new Error('이미지 업로드에 실패했습니다.')
    $(element.value).summernote('insertImage', url, file.name || '')
  } catch (err) {
    throw new Error(getErrorMessage(err, '이미지 업로드에 실패했습니다.'))
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
  await import('summernote/dist/lang/summernote-ko-KR.js')
  $(element.value).summernote({
    lang: 'ko-KR',
    height: 420,
    minHeight: 240,
    placeholder: '글을 작성하세요. 이미지는 붙여넣기할 수 있습니다.',
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
          $q.notify({ type: 'negative', message: err.message || '이미지 업로드에 실패했습니다.' })
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
