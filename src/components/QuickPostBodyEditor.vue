<template>
  <div class="wiki-quick-post-editor">
    <TextareaEditor
      v-if="editorType === 'textarea'"
      :key="editorKey"
      v-model="model"
      :placeholder="placeholder"
      :input-style="textareaStyle"
    />
    <CkeditorEditor
      v-else-if="editorType === 'ckeditor'"
      :key="editorKey"
      v-model="model"
    />
    <SummernoteEditor
      v-else-if="editorType === 'summernote'"
      :key="editorKey"
      v-model="model"
    />
    <TuiEditor
      v-else-if="editorType === 'tui'"
      :key="editorKey"
      v-model="model"
    />
    <EditorJsEditor
      v-else-if="editorType === 'editorjs'"
      :key="editorKey"
      v-model="model"
    />
    <SourceEditor
      v-else-if="editorType === 'html'"
      :key="editorKey"
      v-model="model"
      mode="html"
    />
    <SourceEditor
      v-else
      :key="editorKey"
      v-model="model"
      mode="markdown"
    />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { normalizeEditorType } from '@/utils/editors'
import { useSettingsStore } from '@/stores/settings'

const TextareaEditor = defineAsyncComponent(() => import('@/components/TextareaEditor.vue'))
const CkeditorEditor = defineAsyncComponent(() => import('@/components/CkeditorEditor.vue'))
const SummernoteEditor = defineAsyncComponent(() => import('@/components/SummernoteEditor.vue'))
const TuiEditor = defineAsyncComponent(() => import('@/components/TuiEditor.vue'))
const EditorJsEditor = defineAsyncComponent(() => import('@/components/EditorJsEditor.vue'))
const SourceEditor = defineAsyncComponent(() => import('@/components/SourceEditor.vue'))

const props = defineProps({
  compact: { type: Boolean, default: false },
  placeholder: { type: String, default: '내용을 입력하세요.' },
  editorKey: { type: [String, Number], default: 'quick-post' }
})

const model = defineModel({ type: String, default: '' })
const settings = useSettingsStore()
const editorType = computed(() => normalizeEditorType(settings.quickPostEditor, 'textarea'))
const textareaStyle = computed(() => (
  props.compact
    ? 'min-height: 160px; line-height: 1.5;'
    : 'min-height: 280px; line-height: 1.5;'
))
</script>
