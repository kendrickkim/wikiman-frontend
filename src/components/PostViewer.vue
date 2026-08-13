<template>
  <div v-if="editorType === 'markdown'" class="wiki-content" v-html="markdownHtml" />
  <div v-else-if="editorType === 'html' || editorType === 'ckeditor'" class="wiki-content wiki-html" v-html="htmlContent" />
  <div v-else class="wiki-content">
    <template v-for="(block, index) in blocks" :key="index">
      <component :is="headingTag(block)" v-if="block.type === 'header'" v-html="safeText(block.data?.text)" />
      <p v-else-if="block.type === 'paragraph'" v-html="safeText(block.data?.text)" />
      <pre v-else-if="isCodeBlock(block)">{{ block.data?.code }}</pre>
      <div v-else-if="block.type === 'list'" v-html="listHtml(block)" />
      <figure v-else-if="block.type === 'image'" class="q-my-md">
        <img :src="block.data?.file?.url" :alt="block.data?.caption || ''" />
        <figcaption v-if="block.data?.caption" class="text-grey-7 q-mt-xs">{{ block.data.caption }}</figcaption>
      </figure>
      <table v-else-if="block.type === 'table'">
        <thead v-if="tableHead(block).length">
          <tr>
            <th v-for="(cell, c) in tableHead(block)" :key="c" v-html="cellHtml(cell)" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, r) in tableBody(block)" :key="r">
            <td v-for="(cell, c) in row" :key="c" v-html="cellHtml(cell)" />
          </tr>
        </tbody>
      </table>
      <p v-else-if="fallbackText(block)" v-html="fallbackText(block)" />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps({
  editorType: { type: String, default: 'ckeditor' },
  content: { type: String, default: '' }
})

const markdownHtml = computed(() => renderMarkdown(props.content))
const htmlContent = computed(() => props.content || '')
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

function listItemText(item) {
  if (typeof item === 'string') return item
  return item?.content || item?.text || ''
}

function listHtml(block) {
  return renderListItems(block.data?.items || [], block.data?.style || 'unordered')
}

function renderListItems(items, style) {
  if (!items?.length) return ''
  if (style === 'checklist') {
    return `<ul class="wiki-checklist">${items.map((item) => {
      const checked = item?.meta?.checked || item?.checked ? ' checked' : ''
      const children = renderListItems(item.items || [], style)
      return `<li><label class="wiki-checklist__item"><input type="checkbox" disabled${checked}><span>${listItemText(item)}</span></label>${children}</li>`
    }).join('')}</ul>`
  }
  const tag = style === 'ordered' ? 'ol' : 'ul'
  return `<${tag}>${items.map((item) => {
    const children = renderListItems(item.items || [], style)
    return `<li>${listItemText(item)}${children}</li>`
  }).join('')}</${tag}>`
}

function tableRows(block) {
  return block.data?.content || block.data?.rows || []
}

function tableHead(block) {
  const rows = tableRows(block)
  if (!block.data?.withHeadings || !rows.length) return []
  return rows[0]
}

function tableBody(block) {
  const rows = tableRows(block)
  if (block.data?.withHeadings) return rows.slice(1)
  return rows
}

function cellHtml(cell) {
  if (cell == null) return ''
  if (typeof cell === 'object') return safeText(cell.content ?? cell.text ?? '')
  return safeText(cell)
}

function fallbackText(block) {
  const text = block?.data?.text || block?.data?.caption || block?.data?.code
  return text ? safeText(text) : ''
}

function safeText(value) {
  return value == null ? '' : String(value)
}
</script>
