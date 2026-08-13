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
import { api } from '@/utils/api'

defineProps({
  modelValue: { type: Array, default: () => [] }
})
defineEmits(['update:modelValue'])

const allKeywords = ref([])
const filteredOptions = ref([])

onMounted(async () => {
  try {
    const { data } = await api.get('/posts/keywords')
    allKeywords.value = data.keywords || []
    filteredOptions.value = allKeywords.value
  } catch {
    allKeywords.value = []
  }
})

function onFilter(val, update) {
  update(() => {
    const needle = String(val || '').trim().toLowerCase()
    filteredOptions.value = needle
      ? allKeywords.value.filter((keyword) => keyword.toLowerCase().includes(needle))
      : allKeywords.value
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
