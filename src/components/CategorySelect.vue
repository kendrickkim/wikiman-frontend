<template>
  <div class="category-select row no-wrap items-stretch q-gutter-sm">
    <q-select
      class="col"
      :model-value="modelValue"
      :options="options"
      emit-value
      map-options
      outlined
      :dense="!isDesktop"
      clearable
      label="카테고리"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <q-btn
      v-if="canManage"
      class="category-select__manage"
      :class="{ 'category-select__manage--dense': !isDesktop }"
      outline
      no-caps
      unelevated
      icon="account_tree"
      :label="isDesktop ? '관리' : undefined"
      :aria-label="'카테고리 관리'"
      @click="managerOpen = true"
    />
    <CategoryManagerDialog v-model="managerOpen" @saved="onSaved" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useWikiStore } from '@/stores/wiki'
import { useAuthStore } from '@/stores/auth'
import { useLayout } from '@/composables/useLayout'
import CategoryManagerDialog from './CategoryManagerDialog.vue'

const props = defineProps({
  modelValue: { type: [Number, String], default: null }
})
const emit = defineEmits(['update:modelValue', 'managed'])

const { isDesktop } = useLayout()
const wiki = useWikiStore()
const auth = useAuthStore()
const managerOpen = ref(false)
const canManage = computed(() => auth.canWrite)
const options = computed(() => wiki.flatOptions.map((c) => ({ label: c.label, value: c.id })))

function onSaved() {
  const id = props.modelValue
  if (id != null && !wiki.categories.some((c) => c.id === Number(id))) {
    emit('update:modelValue', null)
  }
  emit('managed')
}
</script>

<style scoped>
.category-select__manage {
  min-height: 56px;
  height: 56px;
  padding: 0 16px;
}

.category-select__manage--dense {
  min-height: 40px;
  height: 40px;
  padding: 0 12px;
}
</style>
