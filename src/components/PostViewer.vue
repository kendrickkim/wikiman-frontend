<template>
  <div
    v-if="editorType === 'textarea'"
    class="wiki-content wiki-plaintext"
  >{{ content }}</div>
  <div
    v-else-if="editorType === 'markdown' || editorType === 'tui'"
    class="wiki-content"
    v-html="markdownHtml"
    @click="onContentClick"
  />
  <div
    v-else-if="editorType === 'html' || editorType === 'ckeditor' || editorType === 'summernote'"
    class="wiki-content wiki-html"
    v-html="htmlContent"
  />
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
import { useI18n } from '@/i18n'

const { t } = useI18n()
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { renderMarkdown } from '@/utils/markdown'
import { sanitizeHtml } from '@/utils/sanitize'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({
  editorType: { type: String, default: 'ckeditor' },
  content: { type: String, default: '' }
})

const $q = useQuasar()
const settings = useSettingsStore()
const markdownHtml = computed(() => sanitizeHtml(renderMarkdown(props.content, {
  codeLineNumbers: settings.codeLineNumbers
})))
const htmlContent = computed(() => sanitizeHtml(props.content || ''))
const blocks = computed(() => {
  try {
    return JSON.parse(props.content || '{"blocks":[]}').blocks || []
  } catch {
    return []
  }
})

function codeTextFromBlock(block) {
  const lined = block.querySelectorAll('.wiki-code-line__content')
  if (lined.length) {
    return Array.from(lined).map((el) => el.textContent || '').join('\n')
  }
  const code = block.querySelector('pre code, code')
  return code?.textContent || ''
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const input = document.createElement('textarea')
  input.value = text
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}

async function onContentClick(event) {
  const btn = event.target.closest?.('.wiki-code-copy')
  if (!btn) return
  event.preventDefault()
  const block = btn.closest('.wiki-code-block')
  if (!block) return
  const text = codeTextFromBlock(block)
  try {
    await copyText(text)
    const prev = btn.textContent
    btn.textContent = t('remaining.k044')
    btn.classList.add('wiki-code-copy--done')
    window.setTimeout(() => {
      btn.textContent = prev || t('remaining.k045')
      btn.classList.remove('wiki-code-copy--done')
    }, 1200)
    $q.notify({ type: 'positive', message: t('remaining.k046') })
  } catch {
    $q.notify({ type: 'negative', message: t('remaining.k047') })
  }
}

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
  return sanitizeHtml(value == null ? '' : String(value))
}
</script>
