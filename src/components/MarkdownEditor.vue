<template>
  <SourceEditor v-model="model" mode="markdown" />
</template>

<script setup>
import { computed } from 'vue'
import SourceEditor from './SourceEditor.vue'

const props = defineProps({
  modelValue: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])
const model = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>
