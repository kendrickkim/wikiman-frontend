<template>
  <div ref="holder" class="editorjs-holder" />
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
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
let savedRange = null

const EditorCtor = EditorJS.default || EditorJS

function selectedText() {
  const selection = window.getSelection()
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null
  if (!range || !holder.value?.contains(range.commonAncestorContainer)) {
    savedRange = null
    return ''
  }
  savedRange = range.cloneRange()
  return selection.toString()
}

async function insertLink({ href, label }) {
  if (!editor || props.readOnly) return
  const selection = window.getSelection()
  if (savedRange) {
    selection.removeAllRanges()
    selection.addRange(savedRange)
  }
  if (selection?.toString()) {
    document.execCommand('createLink', false, href)
  } else {
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.textContent = label || href
    const range = savedRange
    if (range) {
      range.deleteContents()
      range.insertNode(anchor)
      range.setStartAfter(anchor)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    } else {
      const block = editor.blocks.getCurrentBlockIndex()
      editor.blocks.insert('paragraph', { text: anchor.outerHTML }, {}, block + 1, true)
    }
  }
  savedRange = null
  const data = await editor.save()
  emit('update:modelValue', JSON.stringify(data))
}

defineExpose({ selectedText, insertLink })

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
    placeholder: t('remaining.k032'),
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
