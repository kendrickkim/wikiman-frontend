<template>
  <div>
    <q-select
      :model-value="modelValue"
      :options="options"
      emit-value
      map-options
      outlined
      dense
      clearable
      label="카테고리"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <q-btn
      v-if="canManage"
      class="q-mt-sm"
      flat
      dense
      no-caps
      icon="account_tree"
      label="카테고리 관리"
      @click="managerOpen = true"
    />
    <CategoryManagerDialog v-model="managerOpen" @saved="$emit('managed')" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useWikiStore } from '@/stores/wiki'
import { useAuthStore } from '@/stores/auth'
import CategoryManagerDialog from './CategoryManagerDialog.vue'

defineProps({
  modelValue: { type: [Number, String], default: null }
})
defineEmits(['update:modelValue', 'managed'])

const wiki = useWikiStore()
const auth = useAuthStore()
const managerOpen = ref(false)
const canManage = computed(() => auth.canWrite)
const options = computed(() => wiki.flatOptions.map((c) => ({ label: c.label, value: c.id })))
</script>
