<template>
  <div>
    <div ref="parent" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { html } from '@codemirror/lang-html'
import { api } from '@/utils/api'

const props = defineProps({
  modelValue: { type: String, default: '' },
  mode: { type: String, default: 'markdown' }
})
const emit = defineEmits(['update:modelValue'])

const parent = ref(null)
let view = null
let applying = false

function selectedText() {
  if (!view) return ''
  const selection = view.state.selection.main
  return view.state.sliceDoc(selection.from, selection.to)
}

function insertLink({ href, label }) {
  if (!view) return
  const selection = view.state.selection.main
  const text = label || selectedText() || href
  const escapedHref = props.mode === 'html'
    ? href.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    : href.replace(/\)/g, '\\)')
  const escapedText = props.mode === 'html'
    ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    : text.replace(/\]/g, '\\]')
  const insert = props.mode === 'html'
    ? `<a href="${escapedHref}">${escapedText}</a>`
    : `[${escapedText}](${escapedHref})`
  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert },
    selection: { anchor: selection.from + insert.length }
  })
  view.focus()
}

defineExpose({ selectedText, insertLink })

async function pasteImage(file) {
  const form = new FormData()
  form.append('image', file)
  const { data } = await api.post('/uploads', form)
  const url = data.url || data.file?.url
  if (!url || !view) return
  const insert = props.mode === 'html'
    ? `<img src="${url}" alt="">`
    : `![](${url})`
  view.dispatch({
    changes: { from: view.state.selection.main.from, insert },
    selection: { anchor: view.state.selection.main.from + insert.length }
  })
}

onMounted(() => {
  view = new EditorView({
    parent: parent.value,
    state: EditorState.create({
      doc: props.modelValue || '',
      extensions: [
        basicSetup,
        props.mode === 'html' ? html() : markdown(),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (applying || !update.docChanged) return
          emit('update:modelValue', update.state.doc.toString())
        }),
        EditorView.domEventHandlers({
          paste(event) {
            const items = Array.from(event.clipboardData?.items || [])
            const imageItem = items.find((item) => item.type.startsWith('image/'))
            if (!imageItem) return false
            event.preventDefault()
            const file = imageItem.getAsFile()
            if (file) pasteImage(file)
            return true
          }
        })
      ]
    })
  })
})

watch(() => props.modelValue, (value) => {
  if (!view) return
  const current = view.state.doc.toString()
  if (current === value) return
  applying = true
  view.dispatch({
    changes: { from: 0, to: current.length, insert: value || '' }
  })
  applying = false
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})
</script>
