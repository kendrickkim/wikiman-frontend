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
import { api } from '@/utils/api'

const props = defineProps({
  modelValue: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const parent = ref(null)
let view = null
let applying = false

async function pasteImage(file) {
  const form = new FormData()
  form.append('image', file)
  const { data } = await api.post('/uploads', form)
  const url = data.url || data.file?.url
  if (!url || !view) return
  const insert = `![](${url})`
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
        markdown(),
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
