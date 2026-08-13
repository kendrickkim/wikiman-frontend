<template>
  <div ref="holder" class="editorjs-holder" />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import CodeTool from '@editorjs/code'
import Table from '@editorjs/table'
import ImageTool from '@editorjs/image'
import { api } from '@/utils/api'

const props = defineProps({
  modelValue: { type: String, default: '{"blocks":[]}' },
  readOnly: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const holder = ref(null)
let editor = null

const EditorCtor = EditorJS.default || EditorJS

function parseContent(value) {
  try {
    const parsed = JSON.parse(value || '{"blocks":[]}')
    if (!parsed.blocks) return { blocks: [] }
    return parsed
  } catch {
    return { blocks: [] }
  }
}

async function uploadByFile(file) {
  const form = new FormData()
  form.append('image', file)
  const { data } = await api.post('/uploads', form)
  return data
}

async function onPaste(event) {
  if (props.readOnly || !editor) return
  const items = Array.from(event.clipboardData?.items || [])
  const imageItem = items.find((item) => item.type.startsWith('image/'))
  if (!imageItem) return
  const file = imageItem.getAsFile()
  if (!file) return
  event.preventDefault()
  event.stopPropagation()
  const data = await uploadByFile(file)
  const url = data.file?.url || data.url
  if (!url) return
  editor.blocks.insert('image', { file: { url }, caption: '' })
}

onMounted(async () => {
  editor = new EditorCtor({
    holder: holder.value,
    readOnly: props.readOnly,
    placeholder: '글을 작성하세요. 이미지는 붙여넣기할 수 있습니다.',
    data: parseContent(props.modelValue),
    tools: {
      header: { class: Header.default || Header, inlineToolbar: true },
      list: { class: List.default || List, inlineToolbar: true },
      code: CodeTool.default || CodeTool,
      table: Table.default || Table,
      image: {
        class: ImageTool.default || ImageTool,
        config: {
          uploader: {
            uploadByFile,
            async uploadByUrl(url) {
              return { success: 1, file: { url } }
            }
          }
        }
      }
    },
    async onChange() {
      if (props.readOnly || !editor) return
      const data = await editor.save()
      emit('update:modelValue', JSON.stringify(data))
    }
  })
  await editor.isReady
  holder.value?.addEventListener('paste', onPaste, true)
})

onBeforeUnmount(() => {
  holder.value?.removeEventListener('paste', onPaste, true)
  if (editor?.destroy) editor.destroy()
  editor = null
})
</script>
