<template>
  <q-input
    ref="inputRef"
    v-model="model"
    type="textarea"
    outlined
    autogrow
    class="wiki-textarea-editor"
    :placeholder="placeholder"
    :input-style="inputStyle"
  />
</template>

<script setup>
import { t as translate, useI18n } from '@/i18n'

const { t } = useI18n()
import { nextTick, ref } from 'vue'

defineProps({
    placeholder: { type: String, default: translate('remaining.k062') },
  inputStyle: {
    type: String,
    default: 'min-height: 280px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; line-height: 1.5;'
  }
})

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
