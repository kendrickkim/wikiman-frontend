<template>
  <q-input
    ref="inputRef"
    v-model="model"
    type="textarea"
    outlined
    autogrow
    class="wiki-textarea-editor"
    placeholder="글을 작성하세요."
    input-style="min-height: 280px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; line-height: 1.5;"
  />
</template>

<script setup>
import { nextTick, ref } from 'vue'

const model = defineModel({ type: String, default: '' })
const inputRef = ref(null)

function nativeInput() {
  return inputRef.value?.getNativeElement?.() || null
}

function selectedText() {
  const el = nativeInput()
  if (!el) return ''
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  return String(model.value || '').slice(start, end)
}

function insertLink({ href, label }) {
  const el = nativeInput()
  const text = String(model.value || '')
  const start = el?.selectionStart ?? text.length
  const end = el?.selectionEnd ?? text.length
  const selected = text.slice(start, end)
  const insert = label || selected || href
  const next = `${text.slice(0, start)}${insert} (${href})${text.slice(end)}`
  model.value = next
  const caret = start + insert.length + href.length + 3
  nextTick(() => {
    el?.focus()
    el?.setSelectionRange?.(caret, caret)
  })
}

defineExpose({ selectedText, insertLink })
</script>
