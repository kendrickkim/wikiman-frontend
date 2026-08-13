<template>
  <div v-if="editorType === 'markdown'" class="wiki-content" v-html="markdownHtml" />
  <div v-else class="wiki-content">
    <template v-for="(block, index) in blocks" :key="index">
      <component :is="headingTag(block)" v-if="block.type === 'header'" v-html="safeText(block.data?.text)" />
      <p v-else-if="block.type === 'paragraph'" v-html="safeText(block.data?.text)" />
      <pre v-else-if="isCodeBlock(block)">{{ block.data?.code }}</pre>
      <ul v-else-if="isList(block, 'unordered')" v-html="listHtml(block)" />
      <ol v-else-if="isList(block, 'ordered')" v-html="listHtml(block)" />
      <figure v-else-if="block.type === 'image'" class="q-my-md">
        <img :src="block.data?.file?.url" :alt="block.data?.caption || ''" />
        <figcaption v-if="block.data?.caption" class="text-grey-7 q-mt-xs">{{ block.data.caption }}</figcaption>
      </figure>
      <table v-else-if="block.type === 'table'">
        <tbody>
          <tr v-for="(row, r) in tableRows(block)" :key="r">
            <td v-for="(cell, c) in row" :key="c" v-html="safeText(cell)" />
          </tr>
        </tbody>
      </table>
      <p v-else class="text-grey-7">지원하지 않는 블록입니다.</p>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps({
  editorType: { type: String, default: 'editorjs' },
  content: { type: String, default: '' }
})

const markdownHtml = computed(() => renderMarkdown(props.content))
const blocks = computed(() => {
  try {
    return JSON.parse(props.content || '{"blocks":[]}').blocks || []
  } catch {
    return []
  }
})

function headingTag(block) {
  const level = Math.min(Math.max(Number(block.data?.level) || 2, 1), 6)
  return `h${level}`
}

function isCodeBlock(block) {
  return block.type === 'code'
}

function isList(block, style) {
  return block.type === 'list' && (block.data?.style || 'unordered') === style
}

function listItemText(item) {
  if (typeof item === 'string') return item
  return item?.content || item?.text || ''
}

function listHtml(block) {
  return (block.data?.items || []).map((item) => `<li>${listItemText(item)}</li>`).join('')
}

function tableRows(block) {
  return block.data?.content || block.data?.rows || []
}

function safeText(value) {
  return value == null ? '' : String(value)
}
</script>
