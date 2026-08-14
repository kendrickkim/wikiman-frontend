<template>
  <q-select
    :model-value="modelValue"
    :options="filteredOptions"
    use-input
    use-chips
    multiple
    hide-dropdown-icon
    input-debounce="200"
    new-value-mode="add-unique"
    outlined
    label="키워드"
    hint="Enter로 여러 개를 추가할 수 있습니다."
    @update:model-value="$emit('update:modelValue', $event || [])"
    @filter="onFilter"
    @new-value="addKeyword"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useWikiStore } from '@/stores/wiki'

defineProps({
  modelValue: { type: Array, default: () => [] }
})
defineEmits(['update:modelValue'])

const wiki = useWikiStore()
const filteredOptions = ref([])

onMounted(async () => {
  await wiki.ensureKeywords()
  filteredOptions.value = wiki.keywordNames
})

function onFilter(val, update) {
  update(() => {
    const needle = String(val || '').trim().toLowerCase()
    const all = wiki.keywordNames
    filteredOptions.value = needle
      ? all.filter((keyword) => keyword.toLowerCase().includes(needle))
      : all
  })
}

function addKeyword(val, done) {
  const keyword = String(val || '').trim().replace(/\s+/g, ' ')
  if (!keyword) {
    done()
    return
  }
  done(keyword, 'add-unique')
}
</script>
